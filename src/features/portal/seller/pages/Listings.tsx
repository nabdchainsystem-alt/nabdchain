import React, { useState, useEffect } from 'react';
import { Plus, MagnifyingGlass, Cube, DotsThree, PencilSimple, Trash, Copy, CaretDown, CalendarBlank } from 'phosphor-react';
import { Container, PageHeader, Button, EmptyState } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { AddProductPanel, ProductFormData } from '../components/AddProductPanel';

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

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="content">
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

        {/* Filter Bar */}
        <div
          className="flex items-center mb-6 rounded-lg border overflow-hidden"
          style={{
            borderColor: styles.border,
            backgroundColor: styles.bgCard,
          }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-4 h-10 border-r" style={{ borderColor: styles.border }}>
            <MagnifyingGlass size={16} style={{ color: styles.textMuted }} />
            <input
              type="text"
              placeholder={t('seller.listings.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none text-sm bg-transparent w-36"
              style={{
                color: styles.textPrimary,
                fontFamily: styles.fontBody,
              }}
            />
          </div>

          {/* Category Filter */}
          <FilterDropdown styles={styles}>
            <option value="">{t('seller.listings.allCategories')}</option>
            <option value="machinery">{t('buyer.marketplace.machinery')}</option>
            <option value="spare_parts">{t('buyer.marketplace.spareParts')}</option>
            <option value="electronics">{t('buyer.marketplace.electronics')}</option>
          </FilterDropdown>

          {/* Manufacturer Filter */}
          <FilterDropdown styles={styles}>
            <option value="">All Manufacturers...</option>
          </FilterDropdown>

          {/* Status Filter */}
          <FilterDropdown styles={styles}>
            <option value="">{t('seller.listings.allStatus')}</option>
            <option value="active">{t('seller.listings.active')}</option>
            <option value="draft">{t('seller.listings.draft')}</option>
            <option value="out_of_stock">{t('seller.listings.outOfStock')}</option>
          </FilterDropdown>

          {/* Date Range */}
          <button
            className="flex items-center gap-2 px-4 h-10 text-sm transition-colors border-r"
            style={{ color: styles.textMuted, borderColor: styles.border }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <CalendarBlank size={16} />
            <span>Select Date Range</span>
            <CaretDown size={12} />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status Quick Filter */}
          <div
            className="flex items-center gap-2 px-4 h-10 rounded-md mx-1"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <div className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: styles.border }} />
            </div>
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              Status
            </span>
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: styles.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: styles.textMuted
              }}
            >
              {products.filter(p => p.status === 'active').length}/{products.length}
            </span>
            <CaretDown size={12} style={{ color: styles.textMuted }} />
          </div>
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

// Grid template for consistent alignment between header and rows - fully flexible
const TABLE_GRID = '2fr 1fr 1fr 1fr 100px 80px 90px 50px';

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
        className="grid items-center px-5 py-3 text-xs font-semibold uppercase tracking-wider"
        style={{
          gridTemplateColumns: TABLE_GRID,
          backgroundColor: styles.tableHeader,
          color: styles.textMuted,
          borderBottom: `1px solid ${styles.tableBorder}`,
        }}
      >
        <div>{t('seller.listings.productName')}</div>
        <div>{t('seller.listings.category')}</div>
        <div>Brand / Mfr</div>
        <div>Specs</div>
        <div className="text-right pr-2">{t('seller.listings.price')}</div>
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
      className="grid items-center px-5 py-3 group transition-all duration-150"
      style={{
        gridTemplateColumns: TABLE_GRID,
        borderBottom: isLast ? 'none' : `1px solid ${styles.tableBorder}`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.tableRowHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Product Info with Image */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border"
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
              <Cube size={16} style={{ color: styles.textMuted }} />
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
      <div className="text-right pr-2">
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
          className="text-sm font-medium"
          style={{
            color: product.stock === 0 ? styles.error : styles.textPrimary,
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

// Filter Dropdown Component
const FilterDropdown: React.FC<{
  styles: ReturnType<typeof usePortal>['styles'];
  children: React.ReactNode;
}> = ({ styles, children }) => (
  <div className="relative flex items-center h-10 border-r" style={{ borderColor: styles.border }}>
    <select
      className="appearance-none h-full px-4 pr-8 text-sm outline-none cursor-pointer transition-colors bg-transparent"
      style={{
        color: styles.textMuted,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {children}
    </select>
    <CaretDown
      size={12}
      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ color: styles.textMuted }}
    />
  </div>
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
