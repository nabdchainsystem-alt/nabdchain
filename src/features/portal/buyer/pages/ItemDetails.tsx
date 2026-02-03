import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Tag,
  Cube,
  Buildings,
  CheckCircle,
  Clock,
  Truck,
  FileText,
  FilePdf,
  DownloadSimple,
  CaretRight,
  ShoppingCart,
  Plus,
  Info,
  Gear,
  ArrowsClockwise,
  Export,
  Files,
  MapPin,
  ShieldCheck,
  Lightning,
  ChartLine,
  CalendarBlank,
  Image as ImageIcon,
  CaretLeft,
  Spinner,
  ArrowSquareOut,
  TrendUp,
  TrendDown,
  Percent,
  Trophy,
  ClockCounterClockwise,
  Eye,
  EyeSlash,
  Star,
  Medal,
  Handshake,
  Timer,
  CheckSquare,
  ArrowClockwise,
  Sparkle,
} from 'phosphor-react';
import { Container, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import { Item } from '../../types/item.types';
import { RFQFormPanel } from '../components/RFQFormPanel';

interface ItemDetailsProps {
  onNavigate: (page: string) => void;
  itemId?: string;
}

// Mock product data for demonstration
const mockProduct = {
  id: 'PRD-001',
  name: 'High-Pressure Pneumatic Cylinder 32x100',
  sku: 'PNC-32100-HP',
  partNumber: 'FESTO-DSBC-32-100-PA',
  category: 'Pneumatics',
  subcategory: 'Cylinders',
  compatibleBrands: ['Krones', 'SMI', 'Tech-Long'],
  status: 'in_stock' as const,
  visibility: 'public' as const,
  price: '245.00',
  currency: 'SAR',
  moq: 2,
  stock: 48,
  leadTime: '3-5 days',
  shippingNotes: 'Ships from Riyadh warehouse',
  responseTime: '< 4 hours',
  images: [
    '/placeholder-product-1.jpg',
    '/placeholder-product-2.jpg',
    '/placeholder-product-3.jpg',
  ],
  description: 'High-performance pneumatic cylinder designed for demanding industrial applications. Features corrosion-resistant materials and precision engineering for reliable operation in bottling and packaging lines.',
  useCases: [
    'Bottle handling and positioning',
    'Carton sealing mechanisms',
    'Label applicator actuation',
    'Conveyor gate control',
  ],
  benefits: [
    'Extended service life (10M+ cycles)',
    'Low friction operation',
    'Easy maintenance access',
    'Drop-in replacement for OEM parts',
  ],
  specs: {
    boreDiameter: '32 mm',
    stroke: '100 mm',
    operatingPressure: '1-10 bar',
    maxPressure: '12 bar',
    operatingTemp: '-20°C to +80°C',
    weight: '0.45 kg',
    material: 'Anodized Aluminum / Stainless Steel',
    connectionSize: 'G1/8',
    mountingType: 'Through-hole / Foot mount',
    cushioning: 'Adjustable pneumatic cushioning',
  },
  compatibility: {
    machines: ['Krones Contiform S8', 'SMI EBS 8 ERGON', 'Tech-Long CPF 12-12-1'],
    models: ['2018-2024 models'],
    productionLines: ['PET bottling', 'Glass bottling', 'Canning'],
  },
  packaging: {
    type: 'Individual box with foam insert',
    hsCode: '8412.31.00',
    shippingWeight: '0.6 kg',
    dimensions: '150 x 80 x 60 mm',
    origin: 'Germany',
    unitsPerCarton: 20,
  },
  documents: [
    { name: 'Technical Datasheet', type: 'PDF', size: '1.2 MB' },
    { name: 'Installation Manual', type: 'PDF', size: '3.4 MB' },
    { name: 'CE Certificate', type: 'PDF', size: '0.5 MB' },
    { name: 'CAD Drawing (2D)', type: 'DWG', size: '0.8 MB' },
  ],
  rfqStats: {
    totalRfqs: 127,
    avgResponseTime: '3.2 hours',
    lastActivity: '2 days ago',
    quotesThisMonth: 18,
    // Enhanced RFQ Intelligence
    rfqTrend: '+15%' as const,
    winRate: 68.5,
    avgQuoteValue: 2450,
    repeatBuyerRate: 42,
  },
  // Version History for Seller View
  versionHistory: [
    { date: '2024-01-15', changes: ['Price updated from SAR 265 to SAR 245', 'Stock increased to 48'], user: 'System' },
    { date: '2024-01-10', changes: ['Added new product images', 'Updated description'], user: 'Admin' },
    { date: '2024-01-05', changes: ['Initial listing created'], user: 'Admin' },
  ],
  // Trust Signals
  trustSignals: {
    fulfillmentRate: 98.2,
    responseConsistency: 94.5,
    orderCompletionRate: 99.1,
    avgDeliveryAccuracy: 96.8,
    disputeRate: 0.3,
    totalReviews: 156,
    avgRating: 4.8,
  },
  supplier: {
    name: 'Industrial Parts MENA',
    slug: 'industrial-parts-mena',
    location: 'Riyadh, Saudi Arabia',
    verified: true,
    responseSLA: '< 4 hours',
    yearsActive: 8,
    totalProducts: 1240,
  },
};

type TabId = 'overview' | 'specs' | 'compatibility' | 'packaging' | 'documents';

// =============================================================================
// Buyer Intelligence Types & Helpers
// =============================================================================

interface RFQReadiness {
  typicalResponseTime: string;
  responseTimeRating: 'fast' | 'moderate' | 'slow';
  quoteCompetitiveness: 'high' | 'moderate' | 'low';
  fulfillmentRate: number;
  lastQuoteDate: string;
}

interface PriceExpectation {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  currency: string;
  basedOnQuotes: number;
  lastUpdated: string;
}

interface SupplierSnapshot {
  verificationStatus: 'verified' | 'pending' | 'unverified';
  orderSuccessRate: number;
  communicationRating: number;
  onTimeDeliveryRate: number;
  totalCompletedOrders: number;
  avgResponseTime: string;
  memberSince: string;
}

// Generate mock intelligence data (in production, fetched from backend)
const generateRFQReadiness = (item: Item | null): RFQReadiness => {
  const seed = item?.id?.charCodeAt(0) || 65;
  const responseHours = 2 + (seed % 6);
  return {
    typicalResponseTime: `${responseHours} hours`,
    responseTimeRating: responseHours <= 3 ? 'fast' : responseHours <= 6 ? 'moderate' : 'slow',
    quoteCompetitiveness: seed % 3 === 0 ? 'high' : seed % 3 === 1 ? 'moderate' : 'low',
    fulfillmentRate: 85 + (seed % 15),
    lastQuoteDate: '2 days ago',
  };
};

const generatePriceExpectation = (item: Item | null): PriceExpectation | null => {
  if (!item || item.visibility === 'rfq_only') return null;
  const basePrice = item.price;
  const variance = basePrice * 0.15;
  return {
    minPrice: Math.round(basePrice - variance),
    maxPrice: Math.round(basePrice + variance),
    avgPrice: basePrice,
    currency: item.currency,
    basedOnQuotes: 12 + (item.totalQuotes % 20),
    lastUpdated: 'Last 30 days',
  };
};

const generateSupplierSnapshot = (item: Item | null): SupplierSnapshot => {
  const seed = item?.id?.charCodeAt(0) || 65;
  return {
    verificationStatus: seed % 4 === 0 ? 'pending' : 'verified',
    orderSuccessRate: 90 + (seed % 10),
    communicationRating: 4.2 + (seed % 8) * 0.1,
    onTimeDeliveryRate: 88 + (seed % 12),
    totalCompletedOrders: 50 + (seed * 3),
    avgResponseTime: `${2 + (seed % 4)} hours`,
    memberSince: '2019',
  };
};

export const ItemDetails: React.FC<ItemDetailsProps> = ({ onNavigate, itemId }) => {
  const { styles, t, direction, language } = usePortal();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedImage, setSelectedImage] = useState(0);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRFQModal, setShowRFQModal] = useState(false);
  const isRtl = direction === 'rtl';

  // Generate intelligence data
  const rfqReadiness = useMemo(() => generateRFQReadiness(item), [item]);
  const priceExpectation = useMemo(() => generatePriceExpectation(item), [item]);
  const supplierSnapshot = useMemo(() => generateSupplierSnapshot(item), [item]);

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
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId, getToken]);

  // Convert Item to display format
  const product = item ? {
    id: item.id,
    name: language === 'ar' && item.nameAr ? item.nameAr : item.name,
    sku: item.sku,
    partNumber: item.partNumber || '',
    category: item.category,
    subcategory: item.subcategory || '',
    compatibleBrands: [] as string[],
    status: item.stock > 0 ? 'in_stock' : 'out_of_stock' as const,
    visibility: item.visibility,
    price: item.price.toString(),
    currency: item.currency,
    moq: item.minOrderQty,
    stock: item.stock,
    leadTime: item.leadTimeDays ? `${item.leadTimeDays} days` : 'Contact for lead time',
    shippingNotes: `Ships from ${item.origin || 'warehouse'}`,
    responseTime: '< 4 hours',
    images: typeof item.images === 'string' ? JSON.parse(item.images) : (item.images || []),
    description: language === 'ar' && item.descriptionAr ? item.descriptionAr : (item.description || ''),
    useCases: [] as string[],
    benefits: [] as string[],
    specs: typeof item.specifications === 'string' ? JSON.parse(item.specifications) : (item.specifications || {}),
    compatibility: {
      machines: [] as string[],
      models: [] as string[],
      productionLines: [] as string[],
    },
    packaging: {
      type: 'Standard packaging',
      hsCode: '',
      shippingWeight: '',
      dimensions: '',
      origin: item.origin || '',
      unitsPerCarton: 1,
    },
    documents: typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || []),
    rfqStats: {
      totalRfqs: item.totalQuotes,
      avgResponseTime: '3.2 hours',
      lastActivity: 'Recently',
      quotesThisMonth: Math.ceil(item.totalQuotes / 12),
      rfqTrend: '+15%' as const,
      winRate: 68.5,
      avgQuoteValue: item.price,
      repeatBuyerRate: 42,
    },
    versionHistory: mockProduct.versionHistory,
    trustSignals: mockProduct.trustSignals,
    supplier: {
      name: (item as any).user?.name || 'Seller',
      slug: (item as any).user?.sellerProfile?.slug || (item as any).sellerSlug || 'industrial-parts-mena',
      location: item.origin || 'Saudi Arabia',
      verified: true,
      responseSLA: '< 4 hours',
      yearsActive: 5,
      totalProducts: 100,
    },
  } : mockProduct;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('itemDetails.overview'), icon: Info },
    { id: 'specs', label: t('itemDetails.technicalSpecs'), icon: Gear },
    { id: 'compatibility', label: t('itemDetails.compatibility'), icon: ArrowsClockwise },
    { id: 'packaging', label: t('itemDetails.packagingLogistics'), icon: Export },
    { id: 'documents', label: t('itemDetails.documents'), icon: Files },
  ];

  const statusConfig = {
    in_stock: { label: t('itemDetails.inStock'), color: styles.success, bg: 'rgba(34, 197, 94, 0.1)' },
    rfq_only: { label: t('itemDetails.rfqOnly'), color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
    out_of_stock: { label: t('itemDetails.outOfStock'), color: styles.error, bg: 'rgba(239, 68, 68, 0.1)' },
  };

  const status = statusConfig[product.status] || statusConfig.in_stock;

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
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  {t('buyer.marketplace.backToMarketplace')}
                </button>
              }
            />
          </div>
        </Container>
      </div>
    );
  }

  // No item found state
  if (!itemId && !item) {
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
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  {t('buyer.marketplace.backToMarketplace')}
                </button>
              }
            />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors pb-12" style={{ backgroundColor: styles.bgPrimary }}>
      {/* Back Navigation */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{ backgroundColor: styles.bgPrimary, borderColor: styles.border }}
      >
        <Container>
          <div className="py-3">
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: styles.textSecondary }}
              onMouseEnter={(e) => (e.currentTarget.style.color = styles.textPrimary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = styles.textSecondary)}
            >
              {isRtl ? <CaretRight size={16} /> : <CaretLeft size={16} />}
              {t('itemDetails.backToMarketplace')}
            </button>
          </div>
        </Container>
      </div>

      <Container>
        {/* Page Header */}
        <div className="py-6 border-b" style={{ borderColor: styles.border }}>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Left: Product Info */}
            <div className="flex-1">
              <h1
                className="text-2xl lg:text-3xl font-bold mb-2"
                style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
              >
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                <span style={{ color: styles.textMuted }}>
                  {t('itemDetails.sku')}: <span style={{ color: styles.textSecondary }}>{product.sku}</span>
                </span>
                <span style={{ color: styles.border }}>|</span>
                <span style={{ color: styles.textMuted }}>
                  {t('itemDetails.partNumber')}: <span style={{ color: styles.textSecondary }}>{product.partNumber}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  {product.category}
                </span>
                <CaretRight size={12} style={{ color: styles.textMuted }} />
                <span
                  className="px-2.5 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                >
                  {product.subcategory}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs" style={{ color: styles.textMuted }}>
                  {t('itemDetails.compatibleWith')}:
                </span>
                {product.compatibleBrands.map((brand) => (
                  <span
                    key={brand}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: styles.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', color: styles.info }}
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Status & CTAs */}
            <div className={`flex flex-col items-start lg:items-end gap-3 ${isRtl ? 'lg:items-start' : 'lg:items-end'}`}>
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  <CheckCircle size={14} weight="fill" />
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
                    color: styles.isDark ? '#0F1115' : '#E6E8EB',
                  }}
                >
                  <FileText size={16} />
                  {t('itemDetails.requestQuotation')}
                </button>
                <button
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2"
                  style={{
                    borderColor: styles.border,
                    color: styles.textSecondary,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Plus size={16} />
                  {t('itemDetails.addToRfqList')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Columns */}
        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image Gallery & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                {/* Main Image */}
                <div
                  className="aspect-[4/3] flex items-center justify-center"
                  style={{ backgroundColor: styles.bgSecondary }}
                >
                  <Cube size={120} style={{ color: styles.textMuted }} />
                </div>

                {/* Thumbnails */}
                <div className="p-4 flex items-center gap-3 border-t" style={{ borderColor: styles.border }}>
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className="w-16 h-16 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: styles.bgSecondary,
                        border: selectedImage === idx ? `2px solid ${styles.textPrimary}` : `1px solid ${styles.border}`,
                      }}
                    >
                      <ImageIcon size={24} style={{ color: styles.textMuted }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors"
                  style={{ borderColor: styles.border, color: styles.textSecondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FilePdf size={18} style={{ color: styles.error }} />
                  {t('itemDetails.downloadDatasheet')}
                </button>
              </div>

              {/* Tabs Section */}
              <div className="rounded-xl border" style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}>
                {/* Tab Headers */}
                <div
                  className="flex items-center gap-1 p-2 border-b overflow-x-auto"
                  style={{ borderColor: styles.border }}
                >
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                        style={{
                          backgroundColor: isActive ? styles.bgActive : 'transparent',
                          color: isActive ? styles.textPrimary : styles.textSecondary,
                        }}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <OverviewTab product={product} styles={styles} t={t} />
                  )}
                  {activeTab === 'specs' && (
                    <SpecsTab specs={product.specs} styles={styles} t={t} />
                  )}
                  {activeTab === 'compatibility' && (
                    <CompatibilityTab compatibility={product.compatibility} styles={styles} t={t} />
                  )}
                  {activeTab === 'packaging' && (
                    <PackagingTab packaging={product.packaging} styles={styles} t={t} />
                  )}
                  {activeTab === 'documents' && (
                    <DocumentsTab documents={product.documents} styles={styles} t={t} />
                  )}
                </div>
              </div>

              {/* RFQ Intelligence Section */}
              <div
                className="rounded-xl border p-6"
                style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <ChartLine size={20} style={{ color: styles.textSecondary }} />
                  <h3 className="text-base font-semibold" style={{ color: styles.textPrimary }}>
                    {t('itemDetails.rfqIntelligence')}
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label={t('itemDetails.totalRfqs')}
                    value={product.rfqStats.totalRfqs.toString()}
                    styles={styles}
                  />
                  <StatCard
                    label={t('itemDetails.avgResponseTime')}
                    value={product.rfqStats.avgResponseTime}
                    styles={styles}
                  />
                  <StatCard
                    label={t('itemDetails.quotesThisMonth')}
                    value={product.rfqStats.quotesThisMonth.toString()}
                    styles={styles}
                  />
                  <StatCard
                    label={t('itemDetails.lastActivity')}
                    value={product.rfqStats.lastActivity}
                    styles={styles}
                  />
                </div>
              </div>

              {/* RFQ Readiness Panel - Buyer Intelligence */}
              <RFQReadinessPanel readiness={rfqReadiness} styles={styles} t={t} />
            </div>

            {/* Right Column - Sticky Decision Box */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20 space-y-4">
                {/* Price & Order Box */}
                <div
                  className="rounded-xl border p-6"
                  style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                >
                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-sm mb-1" style={{ color: styles.textMuted }}>
                      {t('itemDetails.unitPrice')}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                      >
                        {product.currency} {product.price}
                      </span>
                    </div>
                  </div>

                  {/* Price Expectation Band */}
                  {priceExpectation && (
                    <PriceExpectationBand expectation={priceExpectation} styles={styles} />
                  )}

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <DetailRow
                      icon={Package}
                      label={t('itemDetails.moq')}
                      value={`${product.moq} ${t('itemDetails.units')}`}
                      styles={styles}
                    />
                    <DetailRow
                      icon={Cube}
                      label={t('itemDetails.availableStock')}
                      value={`${product.stock} ${t('itemDetails.units')}`}
                      valueColor={styles.success}
                      styles={styles}
                    />
                    <DetailRow
                      icon={Truck}
                      label={t('itemDetails.leadTime')}
                      value={product.leadTime}
                      styles={styles}
                    />
                    <DetailRow
                      icon={Clock}
                      label={t('itemDetails.responseTime')}
                      value={product.responseTime}
                      styles={styles}
                    />
                  </div>

                  <p className="text-xs mb-4" style={{ color: styles.textMuted }}>
                    {product.shippingNotes}
                  </p>

                  {/* Main CTA - Enhanced */}
                  <button
                    onClick={() => setShowRFQModal(true)}
                    className="w-full py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: styles.success,
                      color: '#FFFFFF',
                    }}
                  >
                    <FileText size={18} />
                    {t('itemDetails.requestQuotation')}
                  </button>

                  {/* Quick RFQ Tips */}
                  <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: styles.textMuted }}>
                    <Sparkle size={12} style={{ color: '#f59e0b' }} />
                    <span>Smart suggestions available</span>
                  </div>
                </div>

                {/* Enhanced Supplier Snapshot Card */}
                <SupplierSnapshotCard
                  supplier={product.supplier}
                  snapshot={supplierSnapshot}
                  styles={styles}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* RFQ Form Panel */}
      <RFQFormPanel
        isOpen={showRFQModal}
        onClose={() => setShowRFQModal(false)}
        item={item}
        sellerId={item?.userId || mockProduct.supplier.id}
        sellerName={mockProduct.supplier.name}
        source="item"
        defaultQuantity={item?.minOrderQty || mockProduct.moq}
        onSuccess={(rfq) => {
          console.log('RFQ created:', rfq);
          // Could navigate to My RFQs or show success message
        }}
      />
    </div>
  );
};

// Tab Components
const OverviewTab: React.FC<{
  product: typeof mockProduct;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ product, styles, t }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-sm font-semibold mb-2" style={{ color: styles.textPrimary }}>
        {t('itemDetails.description')}
      </h4>
      <p className="text-sm leading-relaxed" style={{ color: styles.textSecondary }}>
        {product.description}
      </p>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
        {t('itemDetails.useCases')}
      </h4>
      <ul className="space-y-2">
        {product.useCases.map((useCase, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: styles.textSecondary }}>
            <CheckCircle size={16} weight="fill" style={{ color: styles.success, marginTop: 2, flexShrink: 0 }} />
            {useCase}
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
        {t('itemDetails.keyBenefits')}
      </h4>
      <ul className="space-y-2">
        {product.benefits.map((benefit, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: styles.textSecondary }}>
            <Lightning size={16} weight="fill" style={{ color: '#EAB308', marginTop: 2, flexShrink: 0 }} />
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const SpecsTab: React.FC<{
  specs: typeof mockProduct.specs;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ specs, styles, t }) => {
  const specLabels: Record<string, string> = {
    boreDiameter: t('itemDetails.spec.boreDiameter'),
    stroke: t('itemDetails.spec.stroke'),
    operatingPressure: t('itemDetails.spec.operatingPressure'),
    maxPressure: t('itemDetails.spec.maxPressure'),
    operatingTemp: t('itemDetails.spec.operatingTemp'),
    weight: t('itemDetails.spec.weight'),
    material: t('itemDetails.spec.material'),
    connectionSize: t('itemDetails.spec.connectionSize'),
    mountingType: t('itemDetails.spec.mountingType'),
    cushioning: t('itemDetails.spec.cushioning'),
  };

  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: styles.border }}>
      <table className="w-full text-sm">
        <tbody>
          {Object.entries(specs).map(([key, value], idx) => (
            <tr
              key={key}
              style={{
                backgroundColor: idx % 2 === 0 ? styles.bgSecondary : 'transparent',
              }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: styles.textSecondary, width: '40%' }}>
                {specLabels[key] || key}
              </td>
              <td className="px-4 py-3" style={{ color: styles.textPrimary }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CompatibilityTab: React.FC<{
  compatibility: typeof mockProduct.compatibility;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ compatibility, styles, t }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
        {t('itemDetails.compatibleMachines')}
      </h4>
      <div className="flex flex-wrap gap-2">
        {compatibility.machines.map((machine) => (
          <span
            key={machine}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
          >
            {machine}
          </span>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
        {t('itemDetails.modelYears')}
      </h4>
      <div className="flex flex-wrap gap-2">
        {compatibility.models.map((model) => (
          <span
            key={model}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
          >
            {model}
          </span>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-3" style={{ color: styles.textPrimary }}>
        {t('itemDetails.productionLines')}
      </h4>
      <div className="flex flex-wrap gap-2">
        {compatibility.productionLines.map((line) => (
          <span
            key={line}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const PackagingTab: React.FC<{
  packaging: typeof mockProduct.packaging;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ packaging, styles, t }) => {
  const rows = [
    { label: t('itemDetails.packagingType'), value: packaging.type },
    { label: t('itemDetails.hsCode'), value: packaging.hsCode },
    { label: t('itemDetails.shippingWeight'), value: packaging.shippingWeight },
    { label: t('itemDetails.packageDimensions'), value: packaging.dimensions },
    { label: t('itemDetails.countryOfOrigin'), value: packaging.origin },
    { label: t('itemDetails.unitsPerCarton'), value: packaging.unitsPerCarton.toString() },
  ];

  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: styles.border }}>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.label}
              style={{
                backgroundColor: idx % 2 === 0 ? styles.bgSecondary : 'transparent',
              }}
            >
              <td className="px-4 py-3 font-medium" style={{ color: styles.textSecondary, width: '40%' }}>
                {row.label}
              </td>
              <td className="px-4 py-3" style={{ color: styles.textPrimary }}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DocumentsTab: React.FC<{
  documents: typeof mockProduct.documents;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ documents, styles, t }) => (
  <div className="space-y-3">
    {documents.map((doc) => (
      <div
        key={doc.name}
        className="flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer"
        style={{ borderColor: styles.border }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div className="flex items-center gap-3">
          <FilePdf size={24} style={{ color: styles.error }} />
          <div>
            <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
              {doc.name}
            </p>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {doc.type} • {doc.size}
            </p>
          </div>
        </div>
        <button
          className="p-2 rounded-lg transition-colors"
          style={{ color: styles.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgSecondary)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <DownloadSimple size={20} />
        </button>
      </div>
    ))}
  </div>
);

// Helper Components
const DetailRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ icon: Icon, label, value, valueColor, styles }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={16} style={{ color: styles.textMuted }} />
      <span className="text-sm" style={{ color: styles.textMuted }}>
        {label}
      </span>
    </div>
    <span className="text-sm font-medium" style={{ color: valueColor || styles.textPrimary }}>
      {value}
    </span>
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  styles: ReturnType<typeof usePortal>['styles'];
  icon?: React.ElementType;
  highlight?: boolean;
}> = ({ label, value, styles, icon: Icon, highlight }) => (
  <div
    className="p-4 rounded-lg"
    style={{
      backgroundColor: highlight
        ? styles.isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.08)'
        : styles.bgSecondary,
    }}
  >
    <div className="flex items-center gap-1.5 mb-1">
      {Icon && <Icon size={12} style={{ color: styles.textMuted }} />}
      <p className="text-xs" style={{ color: styles.textMuted }}>
        {label}
      </p>
    </div>
    <p
      className="text-lg font-semibold"
      style={{ color: highlight ? styles.success : styles.textPrimary }}
    >
      {value}
    </p>
  </div>
);

// RFQ Readiness Panel Component - Buyer Intelligence
const RFQReadinessPanel: React.FC<{
  readiness: RFQReadiness;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ readiness, styles, t }) => {
  const ratingConfig = {
    fast: { color: styles.success, label: 'Fast Response', icon: Lightning },
    moderate: { color: '#EAB308', label: 'Moderate', icon: Clock },
    slow: { color: styles.error, label: 'Slow', icon: ClockCounterClockwise },
  };
  const rating = ratingConfig[readiness.responseTimeRating];
  const RatingIcon = rating.icon;

  const competitivenessConfig = {
    high: { color: styles.success, label: 'Highly Competitive' },
    moderate: { color: '#EAB308', label: 'Moderate' },
    low: { color: styles.textMuted, label: 'Limited Data' },
  };
  const competitiveness = competitivenessConfig[readiness.quoteCompetitiveness];

  return (
    <div
      className="rounded-xl border p-6"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightning size={20} style={{ color: styles.success }} />
          <h3 className="text-base font-semibold" style={{ color: styles.textPrimary }}>
            {t('itemDetails.rfqReadiness') || 'RFQ Readiness'}
          </h3>
        </div>
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${rating.color}15`, color: rating.color }}
        >
          <RatingIcon size={12} weight="bold" />
          {rating.label}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {t('itemDetails.typicalResponseTime') || 'Typical Response Time'}
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: rating.color }}>
            {readiness.typicalResponseTime}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-2">
            <Trophy size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {t('itemDetails.fulfillmentRate') || 'Fulfillment Rate'}
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: readiness.fulfillmentRate >= 95 ? styles.success : styles.textPrimary }}>
            {readiness.fulfillmentRate}%
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-2">
            <TrendUp size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {t('itemDetails.quoteCompetitiveness') || 'Quote Competitiveness'}
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: competitiveness.color }}>
            {competitiveness.label}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-2">
            <CalendarBlank size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {t('itemDetails.lastQuote') || 'Last Quote'}
            </span>
          </div>
          <span className="text-sm font-medium" style={{ color: styles.textSecondary }}>
            {readiness.lastQuoteDate}
          </span>
        </div>
      </div>

      {/* Guidance */}
      <div
        className="mt-4 p-3 rounded-lg flex items-start gap-2"
        style={{ backgroundColor: styles.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)' }}
      >
        <Info size={16} style={{ color: styles.info, flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs" style={{ color: styles.textSecondary }}>
          {t('itemDetails.rfqReadinessHint') || 'Based on seller activity patterns. Request a quotation to get exact pricing and availability for your quantity.'}
        </p>
      </div>
    </div>
  );
};

// Trust Metric Component
const TrustMetric: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ icon: Icon, label, value, styles }) => (
  <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
    <div className="flex items-center gap-2">
      <Icon size={14} style={{ color: styles.success }} />
      <span className="text-xs" style={{ color: styles.textMuted }}>{label}</span>
    </div>
    <span className="text-sm font-semibold" style={{ color: styles.success }}>{value}</span>
  </div>
);

// =============================================================================
// Price Expectation Band - Indicative Price Range
// =============================================================================
const PriceExpectationBand: React.FC<{
  expectation: PriceExpectation;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ expectation, styles }) => {
  const range = expectation.maxPrice - expectation.minPrice;
  const avgPosition = range > 0 ? ((expectation.avgPrice - expectation.minPrice) / range) * 100 : 50;

  return (
    <div
      className="mb-4 p-3 rounded-lg"
      style={{ backgroundColor: styles.bgSecondary }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendUp size={12} style={{ color: styles.info }} />
          <span className="text-[10px] font-medium" style={{ color: styles.textSecondary }}>
            Price Range (Indicative)
          </span>
        </div>
        <span className="text-[10px]" style={{ color: styles.textMuted }}>
          Based on {expectation.basedOnQuotes} quotes
        </span>
      </div>

      {/* Price Range Visual */}
      <div className="relative h-2 rounded-full mb-2" style={{ backgroundColor: styles.bgHover }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, ${styles.success}30, ${styles.info}30, ${styles.success}30)`,
          }}
        />
        {/* Average marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2"
          style={{
            left: `calc(${avgPosition}% - 5px)`,
            backgroundColor: styles.bgCard,
            borderColor: styles.info,
          }}
        />
      </div>

      {/* Price Labels */}
      <div className="flex items-center justify-between text-[10px]">
        <span style={{ color: styles.textMuted }}>
          {expectation.currency} {expectation.minPrice.toLocaleString()}
        </span>
        <span className="font-medium" style={{ color: styles.info }}>
          Avg: {expectation.currency} {expectation.avgPrice.toLocaleString()}
        </span>
        <span style={{ color: styles.textMuted }}>
          {expectation.currency} {expectation.maxPrice.toLocaleString()}
        </span>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] mt-2 text-center" style={{ color: styles.textMuted }}>
        *{expectation.lastUpdated} • Actual prices may vary
      </p>
    </div>
  );
};

// =============================================================================
// Enhanced Supplier Snapshot Card
// =============================================================================
const SupplierSnapshotCard: React.FC<{
  supplier: typeof mockProduct.supplier;
  snapshot: SupplierSnapshot;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ supplier, snapshot, styles, t }) => {
  const verificationConfig = {
    verified: { color: styles.success, label: 'Verified', icon: ShieldCheck },
    pending: { color: '#f59e0b', label: 'Pending', icon: Clock },
    unverified: { color: styles.textMuted, label: 'Unverified', icon: ShieldCheck },
  };

  const verification = verificationConfig[snapshot.verificationStatus];
  const VerificationIcon = verification.icon;

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {/* Header with Supplier Name */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <Buildings size={24} style={{ color: styles.textSecondary }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <button
              onClick={() => window.location.href = `/seller/${supplier.slug}`}
              className="font-semibold text-sm truncate hover:underline transition-colors text-left"
              style={{ color: styles.info }}
            >
              {supplier.name}
            </button>
            <VerificationIcon
              size={16}
              weight="fill"
              style={{ color: verification.color }}
            />
          </div>
          <p className="text-xs flex items-center gap-1" style={{ color: styles.textMuted }}>
            <MapPin size={12} />
            {supplier.location}
          </p>
        </div>
      </div>

      {/* Performance Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-1 mb-1">
            <CheckCircle size={10} weight="fill" style={{ color: styles.success }} />
            <span className="text-[10px]" style={{ color: styles.textMuted }}>Success Rate</span>
          </div>
          <span className="text-sm font-bold" style={{ color: styles.success }}>
            {snapshot.orderSuccessRate}%
          </span>
        </div>

        <div className="p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-1 mb-1">
            <Star size={10} weight="fill" style={{ color: '#f59e0b' }} />
            <span className="text-[10px]" style={{ color: styles.textMuted }}>Rating</span>
          </div>
          <span className="text-sm font-bold" style={{ color: styles.textPrimary }}>
            {snapshot.communicationRating.toFixed(1)}/5
          </span>
        </div>

        <div className="p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-1 mb-1">
            <Truck size={10} style={{ color: styles.info }} />
            <span className="text-[10px]" style={{ color: styles.textMuted }}>On-Time</span>
          </div>
          <span className="text-sm font-bold" style={{ color: styles.textPrimary }}>
            {snapshot.onTimeDeliveryRate}%
          </span>
        </div>

        <div className="p-2.5 rounded-lg" style={{ backgroundColor: styles.bgSecondary }}>
          <div className="flex items-center gap-1 mb-1">
            <Handshake size={10} style={{ color: styles.textMuted }} />
            <span className="text-[10px]" style={{ color: styles.textMuted }}>Orders</span>
          </div>
          <span className="text-sm font-bold" style={{ color: styles.textPrimary }}>
            {snapshot.totalCompletedOrders}+
          </span>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-2 pt-3 border-t mb-4" style={{ borderColor: styles.border }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: styles.textMuted }}>Response Time</span>
          <span className="font-medium" style={{ color: styles.success }}>
            {snapshot.avgResponseTime}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: styles.textMuted }}>Member Since</span>
          <span style={{ color: styles.textSecondary }}>
            {snapshot.memberSince}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: styles.textMuted }}>Catalog Size</span>
          <span style={{ color: styles.textSecondary }}>
            {supplier.totalProducts.toLocaleString()} products
          </span>
        </div>
      </div>

      {/* View Profile Button */}
      <button
        onClick={() => window.location.href = `/seller/${supplier.slug}`}
        className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border"
        style={{
          borderColor: styles.border,
          color: styles.textSecondary,
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = styles.bgHover;
          e.currentTarget.style.color = styles.textPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = styles.textSecondary;
        }}
      >
        <ArrowSquareOut size={16} />
        {t('itemDetails.viewSellerProfile') || 'View Seller Profile'}
      </button>
    </div>
  );
};

export default ItemDetails;
