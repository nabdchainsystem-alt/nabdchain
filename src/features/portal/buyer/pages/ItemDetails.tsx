/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { portalApiLogger } from '../../../../utils/logger';
import {
  Package,
  Cube,
  CheckCircle,
  Truck,
  FileText,
  FilePdf,
  Spinner,
  Star,
  ShieldCheck,
  Timer,
  CalendarBlank,
  Gear,
  ArrowsClockwise,
  Export,
  Files,
  ArrowsOut,
} from 'phosphor-react';
import { Container, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import { Item, ItemDocument } from '../../types/item.types';
import { RFQFormPanel } from '../components/RFQFormPanel';
import { AddToCartButton } from '../components/AddToCartButton';

interface ItemDetailsProps {
  onNavigate: (page: string) => void;
  itemId?: string;
}

// Tab type
type TabId = 'overview' | 'specs' | 'compatibility' | 'packaging';

export const ItemDetails: React.FC<ItemDetailsProps> = ({ onNavigate, itemId }) => {
  const { styles, t, direction, language } = usePortal();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const isRtl = direction === 'rtl';

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const fetchedItem = await itemService.getMarketplaceItem(token, itemId);
        setItem(fetchedItem);
        if (fetchedItem?.minOrderQty) {
          setQuantity(fetchedItem.minOrderQty);
        }
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, getToken]);

  // Memoized product data
  const product = useMemo(() => {
    if (!item) return null;

    const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images || [];
    const specs = typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications || {};
    const docs = typeof item.documents === 'string' ? JSON.parse(item.documents) : item.documents || [];

    return {
      id: item.id,
      name: language === 'ar' && item.nameAr ? item.nameAr : item.name,
      sku: item.sku,
      partNumber: item.partNumber || '',
      category: item.category,
      subcategory: item.subcategory || '',
      manufacturer: item.manufacturer || 'Manufacturer',
      brand: item.brand || '',
      status: item.stock > 0 ? 'in_stock' : ('out_of_stock' as const),
      visibility: item.visibility,
      price: item.price,
      currency: item.currency,
      moq: item.minOrderQty,
      stock: item.stock,
      leadTime: item.leadTimeDays ? `${item.leadTimeDays} days` : 'Contact for lead time',
      images: images as string[],
      description: language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description || '',
      specs: specs as Record<string, string>,
      documents: docs as ItemDocument[],
      origin: item.origin || 'Saudi Arabia',
      rating: 4.8,
      reviewCount: 124,
      seller: {
        id: item.userId,
        name: (item as any).user?.name || (item as any).sellerName || 'Verified Seller',
        slug: (item as any).user?.sellerProfile?.slug || (item as any).sellerSlug || 'seller',
        verified: true,
        responseTime: '< 2h',
        onTimeDelivery: 98.5,
        yearsOnPlatform: 12,
      },
    };
  }, [item, language]);

  // Tab configuration
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('itemDetails.overview') },
    { id: 'specs', label: t('itemDetails.technicalSpecs') },
    { id: 'compatibility', label: t('itemDetails.compatibility') },
    { id: 'packaging', label: t('itemDetails.packagingLogistics') },
  ];

  // Calculate estimated delivery date
  const getEstimatedDelivery = () => {
    const today = new Date();
    const minDays = 3;
    const maxDays = 7;
    const from = new Date(today.getTime() + minDays * 24 * 60 * 60 * 1000);
    const to = new Date(today.getTime() + maxDays * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `Est. ${formatDate(from)} - ${formatDate(to)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <div className="flex flex-col items-center gap-4">
          <Spinner size={32} className="animate-spin" style={{ color: styles.info }} />
          <span style={{ color: styles.textMuted }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
        <Container>
          <div className="py-20">
            <EmptyState
              icon={Package}
              title={t('common.error')}
              description={error}
              action={
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: styles.textPrimary, color: styles.bgPrimary }}
                >
                  {t('itemDetails.backToMarketplace')}
                </button>
              }
            />
          </div>
        </Container>
      </div>
    );
  }

  // No item found state
  if (!itemId || !product) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: styles.bgPrimary }}>
        <Container>
          <div className="py-20">
            <EmptyState
              icon={Package}
              title={t('itemDetails.notFound')}
              description={t('itemDetails.notFoundDesc')}
              action={
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: styles.textPrimary, color: styles.bgPrimary }}
                >
                  {t('itemDetails.backToMarketplace')}
                </button>
              }
            />
          </div>
        </Container>
      </div>
    );
  }

  const mainImage = product.images[0] || '';

  return (
    <div
      className="min-h-screen transition-colors flex flex-col"
      style={{ backgroundColor: styles.isDark ? '#191919' : '#f5f5f5' }}
    >
      <div
        className="flex-1 w-full max-w-[1600px] mx-auto min-h-screen flex flex-col"
        style={{
          backgroundColor: styles.bgCard,
          borderLeft: `1px solid ${styles.border}`,
          borderRight: `1px solid ${styles.border}`,
        }}
      >
        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row" style={{ borderBottom: `1px solid ${styles.border}` }}>
          {/* Left Column - Image & Header */}
          <div
            className="flex-1 flex flex-col"
            style={{
              borderRight: isRtl ? 'none' : `1px solid ${styles.border}`,
              borderLeft: isRtl ? `1px solid ${styles.border}` : 'none',
            }}
          >
            {/* Header Section */}
            <div
              className="p-6"
              style={{
                backgroundColor: styles.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                borderBottom: `1px solid ${styles.border}`,
              }}
            >
              {/* Breadcrumb */}
              <nav
                className={`flex flex-wrap gap-2 text-sm mb-4 font-mono ${isRtl ? 'flex-row-reverse' : ''}`}
                style={{ color: styles.textMuted }}
              >
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:underline transition-colors"
                  style={{ color: styles.textMuted }}
                >
                  NABD
                </button>
                <span>/</span>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:underline transition-colors"
                  style={{ color: styles.textMuted }}
                >
                  {product.category}
                </button>
                {product.subcategory && (
                  <>
                    <span>/</span>
                    <span style={{ color: styles.textPrimary }} className="font-medium">
                      {product.subcategory}
                    </span>
                  </>
                )}
              </nav>

              {/* Product Title & Meta */}
              <div
                className={`flex flex-col md:flex-row md:items-end md:justify-between gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}
              >
                <div>
                  <h1
                    className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
                    style={{ color: styles.textPrimary }}
                  >
                    {product.name}
                  </h1>
                  <div className={`flex items-center gap-4 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span
                      className="px-2 py-1 rounded text-xs uppercase tracking-wider font-mono"
                      style={{
                        backgroundColor: styles.bgSecondary,
                        border: `1px solid ${styles.border}`,
                        color: styles.textSecondary,
                      }}
                    >
                      {t('seller.listings.manufacturer')}: {product.manufacturer}
                    </span>
                    <span className="font-mono" style={{ color: styles.textMuted }}>
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex ${isRtl ? 'flex-row-reverse' : ''}`} style={{ color: styles.textPrimary }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        weight={
                          star <= Math.floor(product.rating) ? 'fill' : star <= product.rating ? 'duotone' : 'regular'
                        }
                      />
                    ))}
                  </div>
                  <span className="font-mono text-sm font-bold" style={{ color: styles.textPrimary }}>
                    {product.rating}
                  </span>
                  <span className="text-sm" style={{ color: styles.textMuted }}>
                    ({product.reviewCount} verified)
                  </span>
                </div>
              </div>
            </div>

            {/* Product Image with Blueprint Grid */}
            <div
              className="relative w-full flex-1 min-h-[400px] overflow-hidden group"
              style={{
                backgroundColor: '#FAFAFA',
                backgroundImage: `linear-gradient(to right, ${styles.isDark ? '#333' : '#e5e5e5'} 1px, transparent 1px), linear-gradient(to bottom, ${styles.isDark ? '#333' : '#e5e5e5'} 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-8">
                {mainImage ? (
                  <img
                    alt={product.name}
                    className="h-full w-full object-contain opacity-90 hover:scale-105 transition-transform duration-500"
                    style={{
                      mixBlendMode: styles.isDark ? 'normal' : 'multiply',
                      filter: styles.isDark ? 'none' : 'grayscale(0.1) contrast(1.1)',
                    }}
                    src={mainImage}
                  />
                ) : (
                  <Cube size={120} style={{ color: styles.textMuted }} />
                )}
              </div>

              {/* Spec Callout - Top Left */}
              {product.specs.material && (
                <div
                  className={`absolute top-8 ${isRtl ? 'right-8' : 'left-8'} flex items-center gap-2 group-hover:translate-x-1 transition-transform`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: styles.textPrimary,
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <div
                    className="backdrop-blur px-2 py-1 text-xs font-mono shadow-sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: `1px solid ${styles.border}` }}
                  >
                    <span style={{ color: styles.textMuted }}>Material:</span>{' '}
                    <span className="font-bold" style={{ color: styles.textPrimary }}>
                      {product.specs.material}
                    </span>
                  </div>
                </div>
              )}

              {/* Spec Callout - Bottom Right */}
              {product.specs.weight && (
                <div
                  className={`absolute bottom-12 ${isRtl ? 'left-12' : 'right-12'} flex items-center gap-2 flex-row-reverse group-hover:-translate-x-1 transition-transform delay-75`}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: styles.textPrimary,
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <div
                    className={`backdrop-blur px-2 py-1 text-xs font-mono shadow-sm ${isRtl ? 'text-left' : 'text-right'}`}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', border: `1px solid ${styles.border}` }}
                  >
                    <span style={{ color: styles.textMuted }}>Weight:</span>{' '}
                    <span className="font-bold" style={{ color: styles.textPrimary }}>
                      {product.specs.weight}
                    </span>
                  </div>
                </div>
              )}

              {/* Expand Button */}
              <div className={`absolute bottom-4 ${isRtl ? 'left-4' : 'right-4'}`}>
                <button
                  className="p-2 rounded-full shadow-sm transition-colors"
                  style={{
                    backgroundColor: styles.bgCard,
                    border: `1px solid ${styles.border}`,
                    color: styles.textPrimary,
                  }}
                  title="Expand View"
                >
                  <ArrowsOut size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Seller & Pricing */}
          <div
            className="w-full lg:w-[400px] flex-shrink-0 flex flex-col justify-between"
            style={{ backgroundColor: styles.bgCard }}
          >
            {/* Seller Info */}
            <div className="p-6" style={{ borderBottom: `1px solid ${styles.border}` }}>
              <div className={`flex items-center gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div
                  className="w-10 h-10 flex items-center justify-center rounded font-bold text-lg"
                  style={{ backgroundColor: styles.textPrimary, color: styles.bgCard }}
                >
                  {product.seller.name.charAt(0).toUpperCase()}
                </div>
                <div className={isRtl ? 'text-right' : ''}>
                  <p className="font-bold text-sm" style={{ color: styles.textPrimary }}>
                    {product.seller.name}
                  </p>
                  <p
                    className={`text-[10px] flex items-center gap-1 uppercase tracking-wide ${isRtl ? 'flex-row-reverse' : ''}`}
                    style={{ color: styles.textMuted }}
                  >
                    {product.seller.verified && <ShieldCheck size={14} weight="fill" style={{ color: styles.info }} />}
                    {product.seller.verified ? 'Verified Manufacturer' : 'Seller'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <SellerStatRow
                  icon={Timer}
                  label="Response Time"
                  value={product.seller.responseTime}
                  styles={styles}
                  isRtl={isRtl}
                />
                <div className="w-full h-px" style={{ backgroundColor: styles.border }} />
                <SellerStatRow
                  icon={Truck}
                  label="On-time Delivery"
                  value={`${product.seller.onTimeDelivery}%`}
                  styles={styles}
                  isRtl={isRtl}
                />
                <div className="w-full h-px" style={{ backgroundColor: styles.border }} />
                <SellerStatRow
                  icon={CalendarBlank}
                  label="Years on NABD"
                  value={`${product.seller.yearsOnPlatform}`}
                  styles={styles}
                  isRtl={isRtl}
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="flex-1 flex flex-col">
              <div
                className="p-6"
                style={{
                  borderBottom: `1px solid ${styles.border}`,
                  backgroundColor: styles.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <div className={`flex items-baseline justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: styles.textMuted }}>
                    {t('itemDetails.unitPrice')}
                  </span>
                  {product.status === 'in_stock' && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
                      style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: styles.success }}
                    >
                      {t('itemDetails.inStock')}
                    </span>
                  )}
                </div>

                <div className={`flex items-baseline gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-3xl font-bold font-mono tracking-tighter" style={{ color: styles.textPrimary }}>
                    {product.currency} {product.price.toLocaleString()}
                  </span>
                  <span className="text-xs" style={{ color: styles.textMuted }}>
                    / unit
                  </span>
                </div>

                {/* Quantity Tiers */}
                <div className="pt-3" style={{ borderTop: `1px solid ${styles.border}` }}>
                  <div
                    className={`flex justify-between text-[10px] font-mono uppercase tracking-wider mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                    style={{ color: styles.textMuted }}
                  >
                    <span>Quantity Tier</span>
                    <span>Price/Unit</span>
                  </div>
                  <ul className="space-y-1 text-xs font-mono">
                    <li
                      className={`flex justify-between p-2 rounded shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                      style={{ backgroundColor: styles.bgCard, border: `1px solid ${styles.border}` }}
                    >
                      <span>1 - {product.moq - 1 || 4} units</span>
                      <span className="font-bold">
                        {product.currency} {product.price.toLocaleString()}
                      </span>
                    </li>
                    <li
                      className={`flex justify-between p-2 rounded cursor-pointer transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                      style={{ color: styles.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = styles.bgSecondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{product.moq || 5} - 9 units</span>
                      <span className="font-bold">
                        {product.currency} {Math.round(product.price * 0.96).toLocaleString()}
                      </span>
                    </li>
                    <li
                      className={`flex justify-between p-2 rounded cursor-pointer transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                      style={{ color: styles.textSecondary }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = styles.bgSecondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>10+ units</span>
                      <span className="font-bold" style={{ color: styles.textPrimary }}>
                        Request Quote
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 flex-1 flex flex-col justify-end gap-4" style={{ backgroundColor: styles.bgCard }}>
                {/* Quantity & Delivery */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label
                      className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: styles.textMuted }}
                    >
                      Qty
                    </label>
                    <input
                      type="number"
                      min={product.moq}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(product.moq, parseInt(e.target.value) || product.moq))}
                      className="w-full rounded px-2 py-2 font-mono text-center outline-none text-base h-10 transition-colors"
                      style={{
                        border: `1px solid ${styles.border}`,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label
                      className="block text-[10px] font-bold uppercase tracking-wider mb-1"
                      style={{ color: styles.textMuted }}
                    >
                      Delivery
                    </label>
                    <div
                      className={`rounded px-2 py-2 flex items-center gap-2 h-10 ${isRtl ? 'flex-row-reverse' : ''}`}
                      style={{ border: `1px solid ${styles.border}`, backgroundColor: styles.bgSecondary }}
                    >
                      <Truck size={14} style={{ color: styles.textSecondary }} />
                      <span className="text-xs truncate" style={{ color: styles.textSecondary }}>
                        {getEstimatedDelivery()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  {/* Add to Order Button */}
                  {item && (
                    <AddToCartButton
                      itemId={item.id}
                      showQuantity={true}
                      minOrderQty={product.moq}
                      maxOrderQty={product.stock > 0 ? product.stock : null}
                      disabled={product.stock === 0}
                    />
                  )}

                  {/* Request Custom Quote Button */}
                  <button
                    onClick={() => setShowRFQModal(true)}
                    className={`w-full py-2 px-4 rounded flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                    style={{
                      backgroundColor: styles.bgCard,
                      color: styles.textPrimary,
                      border: `1px solid ${styles.textPrimary}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = styles.bgSecondary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = styles.bgCard;
                    }}
                  >
                    <FileText size={14} />
                    Request Custom Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="w-full" style={{ borderTop: `1px solid ${styles.border}`, backgroundColor: styles.bgCard }}>
          {/* Tab Headers */}
          <div className="overflow-x-auto" style={{ borderBottom: `1px solid ${styles.border}` }}>
            <div className={`flex items-center min-w-full w-max px-6 md:px-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors -mb-[1px] border-b-2 ${isRtl ? 'text-right' : ''}`}
                    style={{
                      backgroundColor: isActive ? styles.bgSecondary : 'transparent',
                      color: isActive ? styles.textPrimary : styles.textMuted,
                      borderColor: isActive ? styles.textPrimary : 'transparent',
                      fontWeight: isActive ? 700 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = styles.bgSecondary;
                        e.currentTarget.style.color = styles.textPrimary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = styles.textMuted;
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <div className={`flex flex-col xl:flex-row gap-12 ${isRtl ? 'xl:flex-row-reverse' : ''}`}>
              {/* Main Content */}
              <div className="flex-1">
                {activeTab === 'overview' && (
                  <OverviewTabContent product={product} styles={styles} t={t} isRtl={isRtl} />
                )}
                {activeTab === 'specs' && <SpecsTabContent specs={product.specs} styles={styles} t={t} isRtl={isRtl} />}
                {activeTab === 'compatibility' && <CompatibilityTabContent styles={styles} t={t} isRtl={isRtl} />}
                {activeTab === 'packaging' && (
                  <PackagingTabContent product={product} styles={styles} t={t} isRtl={isRtl} />
                )}
              </div>

              {/* Technical Resources Sidebar */}
              <div className="w-full xl:w-[400px] flex-shrink-0">
                <TechnicalResources documents={product.documents} styles={styles} isRtl={isRtl} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RFQ Form Panel */}
      <RFQFormPanel
        isOpen={showRFQModal}
        onClose={() => setShowRFQModal(false)}
        item={item}
        sellerId={item?.userId || ''}
        sellerName={product?.seller.name}
        source="item"
        defaultQuantity={quantity}
        onSuccess={(rfq) => {
          portalApiLogger.info('RFQ created:', rfq);
        }}
      />
    </div>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

interface SellerStatRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  styles: any;
  isRtl: boolean;
}

const SellerStatRow: React.FC<SellerStatRowProps> = ({ icon: Icon, label, value, styles, isRtl }) => (
  <div className={`flex items-center gap-3 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
    <Icon size={16} style={{ color: styles.textMuted }} />
    <span className="flex-1" style={{ color: styles.textSecondary, textAlign: isRtl ? 'right' : 'left' }}>
      {label}
    </span>
    <span className="font-mono font-bold" style={{ color: styles.textPrimary }}>
      {value}
    </span>
  </div>
);

interface OverviewTabContentProps {
  product: any;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const OverviewTabContent: React.FC<OverviewTabContentProps> = ({ product, styles, t, isRtl }) => (
  <>
    <h3
      className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{ color: styles.textPrimary, borderBottom: `1px solid ${styles.border}` }}
    >
      <FileText size={18} />
      {t('itemDetails.description')}
    </h3>
    <div className="prose max-w-none text-sm leading-7" style={{ color: styles.textSecondary, textAlign: 'justify' }}>
      <p className="mb-4">{product.description || 'No description available for this product.'}</p>
    </div>

    {/* Quick Specs Grid */}
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8"
      style={{ borderTop: `1px solid ${styles.border}` }}
    >
      {Object.entries(product.specs)
        .slice(0, 4)
        .map(([key, value]) => (
          <div key={key}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: styles.textMuted }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="font-mono font-bold text-sm" style={{ color: styles.textPrimary }}>
              {value as string}
            </div>
          </div>
        ))}
    </div>
  </>
);

interface SpecsTabContentProps {
  specs: Record<string, string>;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const SpecsTabContent: React.FC<SpecsTabContentProps> = ({ specs, styles, t, isRtl }) => (
  <>
    <h3
      className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{ color: styles.textPrimary, borderBottom: `1px solid ${styles.border}` }}
    >
      <Gear size={18} />
      {t('itemDetails.technicalSpecs')}
    </h3>
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${styles.border}` }}>
      <table className={`w-full text-sm ${isRtl ? 'text-right' : ''}`}>
        <tbody>
          {Object.entries(specs).map(([key, value], idx) => (
            <tr key={key} style={{ backgroundColor: idx % 2 === 0 ? styles.bgSecondary : 'transparent' }}>
              <td className="px-4 py-3 font-medium" style={{ color: styles.textSecondary, width: '40%' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </td>
              <td className="px-4 py-3 font-mono" style={{ color: styles.textPrimary }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

interface CompatibilityTabContentProps {
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const CompatibilityTabContent: React.FC<CompatibilityTabContentProps> = ({ styles, t, isRtl }) => (
  <>
    <h3
      className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{ color: styles.textPrimary, borderBottom: `1px solid ${styles.border}` }}
    >
      <ArrowsClockwise size={18} />
      {t('itemDetails.compatibility')}
    </h3>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
          {t('itemDetails.compatibleMachines')}
        </h4>
        <p className="text-sm" style={{ color: styles.textMuted }}>
          Compatibility information not available. Contact the seller for specific compatibility details.
        </p>
      </div>
    </div>
  </>
);

interface PackagingTabContentProps {
  product: any;
  styles: any;
  t: (key: string) => string;
  isRtl: boolean;
}

const PackagingTabContent: React.FC<PackagingTabContentProps> = ({ product, styles, t, isRtl }) => (
  <>
    <h3
      className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
      style={{ color: styles.textPrimary, borderBottom: `1px solid ${styles.border}` }}
    >
      <Export size={18} />
      {t('itemDetails.packagingLogistics')}
    </h3>
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${styles.border}` }}>
      <table className={`w-full text-sm ${isRtl ? 'text-right' : ''}`}>
        <tbody>
          {[
            { label: t('itemDetails.countryOfOrigin'), value: product.origin },
            { label: t('itemDetails.moq'), value: `${product.moq} units` },
            { label: t('itemDetails.leadTime'), value: product.leadTime },
            { label: t('itemDetails.availableStock'), value: `${product.stock} units` },
          ].map((row, idx) => (
            <tr key={row.label} style={{ backgroundColor: idx % 2 === 0 ? styles.bgSecondary : 'transparent' }}>
              <td className="px-4 py-3 font-medium" style={{ color: styles.textSecondary, width: '40%' }}>
                {row.label}
              </td>
              <td className="px-4 py-3 font-mono" style={{ color: styles.textPrimary }}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

interface TechnicalResourcesProps {
  documents: ItemDocument[];
  styles: any;
  isRtl: boolean;
}

const TechnicalResources: React.FC<TechnicalResourcesProps> = ({ documents, styles, isRtl }) => {
  const getDocIcon = (type: string) => {
    switch (type) {
      case 'datasheet':
      case 'manual':
        return { icon: FilePdf, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.2)' };
      case 'certificate':
        return { icon: ShieldCheck, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.2)' };
      case 'warranty':
        return {
          icon: CheckCircle,
          color: '#7c3aed',
          bg: 'rgba(124, 58, 237, 0.1)',
          border: 'rgba(124, 58, 237, 0.2)',
        };
      default:
        return { icon: FileText, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.2)' };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <h3
        className={`text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}
        style={{ color: styles.textPrimary, borderBottom: `1px solid ${styles.border}` }}
      >
        <Files size={18} />
        Technical Resources
      </h3>
      <div className="flex flex-col gap-3">
        {documents.length === 0 ? (
          <p className="text-sm" style={{ color: styles.textMuted }}>
            No documents available.
          </p>
        ) : (
          documents.map((doc, idx) => {
            const { icon: DocIcon, color, bg, border } = getDocIcon(doc.type);
            return (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-4 rounded transition-all group ${isRtl ? 'flex-row-reverse' : ''}`}
                style={{
                  border: `1px solid ${styles.border}`,
                  backgroundColor: styles.bgSecondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = styles.bgCard;
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = styles.bgSecondary;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                  >
                    <DocIcon size={20} style={{ color }} />
                  </div>
                  <div className={isRtl ? 'text-right' : ''}>
                    <span className="block text-sm font-bold transition-colors" style={{ color: styles.textPrimary }}>
                      {doc.name}
                    </span>
                    <span className="text-xs" style={{ color: styles.textMuted }}>
                      {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                    </span>
                  </div>
                </div>
                {doc.size && (
                  <span
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      backgroundColor: styles.bgCard,
                      border: `1px solid ${styles.border}`,
                      color: styles.textMuted,
                    }}
                  >
                    {formatFileSize(doc.size)}
                  </span>
                )}
              </a>
            );
          })
        )}
      </div>
    </>
  );
};

export default ItemDetails;
