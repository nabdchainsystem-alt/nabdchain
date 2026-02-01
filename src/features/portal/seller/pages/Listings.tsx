import React, { useState, useEffect, useMemo } from 'react';
import { Plus, MagnifyingGlass, Cube, DotsThree, PencilSimple, Trash, Copy, Package, CheckCircle, Warning, XCircle, ArrowUp, ArrowDown, Minus } from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { AddProductPanel, ProductFormData } from '../components/AddProductPanel';

// Portal KPI Card Component - Clean branded design with left accent
interface PortalKPICardProps {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  accent: 'primary' | 'success' | 'danger' | 'warning';
}

const PortalKPICard: React.FC<PortalKPICardProps> = ({ label, value, change, trend, icon, accent }) => {
  const { styles } = usePortal();
  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral';

  // Portal brand accent colors
  const accentColors = {
    primary: '#1E3A5F',
    success: '#2D7D46',
    danger: '#C53030',
    warning: '#9A6700',
  };

  const trendColor = isNeutral
    ? styles.textMuted
    : isPositive
      ? accentColors.success
      : accentColors.danger;

  const TrendIcon = isNeutral ? Minus : (isPositive ? ArrowUp : ArrowDown);

  return (
    <div
      className="relative flex items-center gap-4 p-4 rounded-lg overflow-hidden transition-all duration-200 hover:translate-y-[-1px]"
      style={{
        backgroundColor: styles.bgCard,
        boxShadow: styles.isDark
          ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
          : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: accentColors[accent] }}
      />

      {/* Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-lg"
        style={{
          backgroundColor: styles.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          color: accentColors[accent],
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium mb-0.5"
          style={{ color: styles.textMuted }}
        >
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {value}
          </span>
          <span
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color: trendColor }}
          >
            <TrendIcon size={12} weight="bold" />
            {change}
          </span>
        </div>
      </div>
    </div>
  );
};

const PRODUCTS_STORAGE_KEY = 'portal-seller-products';

interface ListingsProps {
  onNavigate: (page: string) => void;
}

interface Product {
  id: string;
  // Basic Info
  name: string;
  sku: string;
  partNumber: string;
  description: string;
  // Pricing & Inventory
  price: string;
  currency: string;
  stock: number;
  minOrderQty: number;
  // Product Details
  category: string;
  manufacturer: string;
  brand: string;
  // Specifications
  weight: string;
  weightUnit: string;
  dimensions: string;
  material: string;
  // Status & Image
  status: 'active' | 'draft' | 'out_of_stock';
  image: string | null;
}

// Placeholder image for products without uploaded image
const placeholderImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop';

export const Listings: React.FC<ListingsProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => {
    // Load from localStorage on initial render
    try {
      const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const { styles, t } = usePortal();

  // Persist products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const handleAddProduct = (productData: ProductFormData) => {
    const stock = parseInt(productData.stock) || 0;
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      // Basic Info
      name: productData.name,
      sku: productData.sku,
      partNumber: productData.partNumber || '-',
      description: productData.description || '',
      // Pricing & Inventory
      price: productData.price,
      currency: productData.currency,
      stock: stock,
      minOrderQty: parseInt(productData.minOrderQty) || 1,
      // Product Details
      category: productData.category,
      manufacturer: productData.manufacturer || '-',
      brand: productData.brand || '-',
      // Specifications
      weight: productData.weight || '-',
      weightUnit: productData.weightUnit,
      dimensions: productData.dimensions || '-',
      material: productData.material || '-',
      // Status & Image
      status: stock === 0 ? 'out_of_stock' : productData.status === 'active' ? 'active' : 'draft',
      image: productData.image,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate KPI stats
  const kpiStats = useMemo(() => {
    const totalItems = products.length;
    const activeItems = products.filter((p) => p.status === 'active').length;
    const outOfStock = products.filter((p) => p.status === 'out_of_stock' || p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

    return { totalItems, activeItems, outOfStock, lowStock };
  }, [products]);

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('seller.listings.title')}
          subtitle={t('seller.listings.subtitle')}
          actions={
            <Button onClick={() => setIsAddPanelOpen(true)}>
              <Plus size={16} className="mr-2" />
              {t('seller.listings.addProduct')}
            </Button>
          }
        />

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-md border max-w-md transition-colors"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
          >
            <MagnifyingGlass size={18} style={{ color: styles.textMuted }} />
            <input
              type="text"
              placeholder={t('seller.listings.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
              style={{
                color: styles.textPrimary,
                fontFamily: styles.fontBody,
              }}
            />
          </div>

          <select
            className="px-4 py-2.5 rounded-md border text-sm outline-none appearance-none cursor-pointer transition-colors"
            style={{
              borderColor: styles.border,
              backgroundColor: styles.bgCard,
              color: styles.textSecondary,
            }}
          >
            <option>{t('seller.listings.allCategories')}</option>
            <option>{t('buyer.marketplace.machinery')}</option>
            <option>{t('buyer.marketplace.spareParts')}</option>
            <option>{t('buyer.marketplace.electronics')}</option>
          </select>

          <select
            className="px-4 py-2.5 rounded-md border text-sm outline-none appearance-none cursor-pointer transition-colors"
            style={{
              borderColor: styles.border,
              backgroundColor: styles.bgCard,
              color: styles.textSecondary,
            }}
          >
            <option>{t('seller.listings.allStatus')}</option>
            <option>{t('seller.listings.active')}</option>
            <option>{t('seller.listings.draft')}</option>
            <option>{t('seller.listings.outOfStock')}</option>
          </select>
        </div>

        {/* Portal KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <PortalKPICard
            label="Total Items"
            value={kpiStats.totalItems}
            change={kpiStats.totalItems > 0 ? `+${kpiStats.totalItems}` : '0'}
            trend={kpiStats.totalItems > 0 ? 'up' : 'neutral'}
            icon={<Package size={20} />}
            accent="primary"
          />
          <PortalKPICard
            label="Active Items"
            value={kpiStats.activeItems}
            change={kpiStats.totalItems > 0 ? `${Math.round((kpiStats.activeItems / kpiStats.totalItems) * 100)}%` : '0%'}
            trend={kpiStats.activeItems > 0 ? 'up' : 'neutral'}
            icon={<CheckCircle size={20} />}
            accent="success"
          />
          <PortalKPICard
            label="Out of Stock"
            value={kpiStats.outOfStock}
            change={kpiStats.outOfStock > 0 ? `${kpiStats.outOfStock} items` : 'None'}
            trend={kpiStats.outOfStock > 0 ? 'down' : 'up'}
            icon={<XCircle size={20} />}
            accent="danger"
          />
          <PortalKPICard
            label="Low Stock"
            value={kpiStats.lowStock}
            change={kpiStats.lowStock > 0 ? 'Alert' : 'OK'}
            trend={kpiStats.lowStock > 0 ? 'down' : 'up'}
            icon={<Warning size={20} />}
            accent="warning"
          />
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Cube}
            title={t('seller.listings.noListings')}
            description={t('seller.listings.noListingsDesc')}
            action={
              <Button onClick={() => setIsAddPanelOpen(true)}>
                {t('seller.listings.addProduct')}
              </Button>
            }
          />
        ) : (
          <ProductsTable products={filteredProducts} />
        )}
      </Container>

      {/* Add Product Panel */}
      <AddProductPanel
        isOpen={isAddPanelOpen}
        onClose={() => setIsAddPanelOpen(false)}
        onSave={handleAddProduct}
      />
    </div>
  );
};

// Grid template for consistent alignment between header and rows
const TABLE_GRID = '280px 140px 150px 130px 110px 80px 100px 50px';

// Clean Products Table Component
const ProductsTable: React.FC<{ products: Product[] }> = ({ products }) => {
  const { styles, t } = usePortal();

  return (
    <div
      className="w-full overflow-hidden rounded-xl border shadow-sm"
      style={{ borderColor: styles.border }}
    >
      {/* Table Header */}
      <div
        className="grid items-center px-5 py-3.5 text-xs font-semibold uppercase tracking-wider gap-2"
        style={{
          gridTemplateColumns: TABLE_GRID,
          backgroundColor: styles.tableHeader,
          color: styles.textMuted,
          borderBottom: `2px solid ${styles.tableBorder}`,
        }}
      >
        <div className="pl-1">{t('seller.listings.productName')}</div>
        <div>{t('seller.listings.category')}</div>
        <div>Brand / Mfr</div>
        <div>Specs</div>
        <div className="text-right">{t('seller.listings.price')}</div>
        <div className="text-center">{t('seller.listings.stock')}</div>
        <div className="text-center">{t('seller.listings.status')}</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div style={{ backgroundColor: styles.bgCard }}>
        {products.map((product, index) => (
          <ProductRow
            key={product.id}
            product={product}
            isLast={index === products.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

// Product Row Component
const ProductRow: React.FC<{ product: Product; isLast: boolean }> = ({ product, isLast }) => {
  const { styles, t } = usePortal();
  const [showMenu, setShowMenu] = useState(false);

  // Format price with currency
  const formattedPrice = `${product.currency} ${parseFloat(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Format specs display
  const specsDisplay = [];
  if (product.weight && product.weight !== '-') {
    specsDisplay.push(`${product.weight} ${product.weightUnit}`);
  }
  if (product.material && product.material !== '-') {
    specsDisplay.push(product.material);
  }

  return (
    <div
      className="grid items-center px-5 py-3.5 group transition-all duration-150 gap-2"
      style={{
        gridTemplateColumns: TABLE_GRID,
        borderBottom: isLast ? 'none' : `1px solid ${styles.tableBorder}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.tableRowHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Product Info with Image */}
      <div className="flex items-center gap-3 pl-1">
        <div
          className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border"
          style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
        >
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Cube size={18} style={{ color: styles.textMuted }} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate leading-tight"
            style={{ color: styles.textPrimary }}
          >
            {product.name}
          </p>
          <p
            className="text-xs truncate mt-0.5"
            style={{ color: styles.textMuted }}
          >
            SKU: {product.sku} {product.partNumber !== '-' && `• P/N: ${product.partNumber}`}
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="text-sm truncate" style={{ color: styles.textSecondary }}>
        {product.category}
      </div>

      {/* Brand / Manufacturer */}
      <div className="min-w-0">
        <p className="text-sm truncate leading-tight" style={{ color: styles.textPrimary }}>
          {product.brand !== '-' ? product.brand : product.manufacturer}
        </p>
        {product.brand !== '-' && product.manufacturer !== '-' && (
          <p className="text-xs truncate mt-0.5" style={{ color: styles.textMuted }}>
            by {product.manufacturer}
          </p>
        )}
      </div>

      {/* Specs */}
      <div className="min-w-0">
        {specsDisplay.length > 0 ? (
          <>
            <p className="text-sm truncate leading-tight" style={{ color: styles.textSecondary }}>
              {specsDisplay[0]}
            </p>
            {specsDisplay[1] && (
              <p className="text-xs truncate mt-0.5" style={{ color: styles.textMuted }}>
                {specsDisplay[1]}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm" style={{ color: styles.textMuted }}>-</p>
        )}
      </div>

      {/* Price */}
      <div className="text-right">
        <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
          {formattedPrice}
        </p>
        {product.minOrderQty > 1 && (
          <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
            Min: {product.minOrderQty}
          </p>
        )}
      </div>

      {/* Stock */}
      <div className="text-center">
        <span
          className="text-sm font-medium inline-block min-w-[40px] py-0.5 px-2 rounded"
          style={{
            color: product.stock === 0 ? styles.error : styles.textPrimary,
            backgroundColor: product.stock === 0 ? (styles.isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)') : 'transparent'
          }}
        >
          {product.stock.toLocaleString()}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center">
        <StatusBadge status={product.status} />
      </div>

      {/* Actions Menu */}
      <div className="flex items-center justify-center">
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <DotsThree size={18} weight="bold" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div
                className="absolute right-0 top-full mt-1 z-20 py-1.5 rounded-lg shadow-lg min-w-[150px]"
                style={{
                  backgroundColor: styles.bgCard,
                  border: `1px solid ${styles.border}`,
                  boxShadow: styles.isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <MenuButton icon={PencilSimple} label={t('common.edit')} styles={styles} />
                <MenuButton icon={Copy} label="Duplicate" styles={styles} />
                <MenuButton icon={Trash} label={t('common.delete')} styles={styles} danger />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Menu Button Component
const MenuButton: React.FC<{
  icon: React.ElementType;
  label: string;
  styles: ReturnType<typeof usePortal>['styles'];
  danger?: boolean;
}> = ({ icon: Icon, label, styles, danger }) => (
  <button
    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors"
    style={{ color: danger ? styles.error : styles.textPrimary }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <Icon size={16} weight={danger ? 'regular' : 'regular'} />
    {label}
  </button>
);

// Status Badge Component
const StatusBadge: React.FC<{ status: Product['status'] }> = ({ status }) => {
  const { styles, t } = usePortal();

  const badgeStyles = {
    active: {
      bg: styles.isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
      text: styles.success,
      border: styles.isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'
    },
    draft: {
      bg: styles.isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(107, 114, 128, 0.1)',
      text: styles.textSecondary,
      border: styles.isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.2)'
    },
    out_of_stock: {
      bg: styles.isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      text: styles.error,
      border: styles.isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'
    },
  };

  const labels = {
    active: t('seller.listings.active'),
    draft: t('seller.listings.draft'),
    out_of_stock: t('seller.listings.outOfStock'),
  };

  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: badgeStyles[status].bg,
        color: badgeStyles[status].text,
        borderColor: badgeStyles[status].border,
      }}
    >
      {labels[status]}
    </span>
  );
};

export default Listings;
