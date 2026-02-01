import React, { useState } from 'react';
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
} from 'phosphor-react';
import { Container } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface ItemDetailsProps {
  onNavigate: (page: string) => void;
  productId?: string;
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
  },
  supplier: {
    name: 'Industrial Parts MENA',
    location: 'Riyadh, Saudi Arabia',
    verified: true,
    responseSLA: '< 4 hours',
    yearsActive: 8,
    totalProducts: 1240,
  },
};

type TabId = 'overview' | 'specs' | 'compatibility' | 'packaging' | 'documents';

export const ItemDetails: React.FC<ItemDetailsProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedImage, setSelectedImage] = useState(0);
  const isRtl = direction === 'rtl';

  const product = mockProduct;

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

  const status = statusConfig[product.status];

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
                  <div className="mb-6">
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

                  {/* Main CTA */}
                  <button
                    className="w-full py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: styles.success,
                      color: '#FFFFFF',
                    }}
                  >
                    <FileText size={18} />
                    {t('itemDetails.requestQuotation')}
                  </button>
                </div>

                {/* Supplier Card */}
                <div
                  className="rounded-xl border p-5"
                  style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <Buildings size={24} style={{ color: styles.textSecondary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-sm truncate" style={{ color: styles.textPrimary }}>
                          {product.supplier.name}
                        </h4>
                        {product.supplier.verified && (
                          <ShieldCheck
                            size={16}
                            weight="fill"
                            style={{ color: styles.success }}
                          />
                        )}
                      </div>
                      <p className="text-xs flex items-center gap-1" style={{ color: styles.textMuted }}>
                        <MapPin size={12} />
                        {product.supplier.location}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: styles.textMuted }}>{t('itemDetails.responseSLA')}</span>
                      <span className="font-medium" style={{ color: styles.success }}>
                        {product.supplier.responseSLA}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: styles.textMuted }}>{t('itemDetails.yearsActive')}</span>
                      <span style={{ color: styles.textSecondary }}>
                        {product.supplier.yearsActive} {t('itemDetails.years')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: styles.textMuted }}>{t('itemDetails.catalogSize')}</span>
                      <span style={{ color: styles.textSecondary }}>
                        {product.supplier.totalProducts.toLocaleString()} {t('itemDetails.products')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {t('itemDetails.contactViaPlaftorm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
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
}> = ({ label, value, styles }) => (
  <div
    className="p-4 rounded-lg"
    style={{ backgroundColor: styles.bgSecondary }}
  >
    <p className="text-xs mb-1" style={{ color: styles.textMuted }}>
      {label}
    </p>
    <p className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
      {value}
    </p>
  </div>
);

export default ItemDetails;
