import React, { useState } from 'react';
import { MagnifyingGlass, Funnel, GridFour, List } from 'phosphor-react';
import { Container, PageHeader } from '../../components';
import { usePortal } from '../../context/PortalContext';

interface MarketplaceProps {
  onNavigate: (page: string) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onNavigate }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const { styles, t } = usePortal();

  const categories = [
    { key: 'all', label: t('common.all') },
    { key: 'machinery', label: t('buyer.marketplace.machinery') },
    { key: 'spareParts', label: t('buyer.marketplace.spareParts') },
    { key: 'electronics', label: t('buyer.marketplace.electronics') },
    { key: 'hydraulics', label: t('buyer.marketplace.hydraulics') },
    { key: 'safetyEquipment', label: t('buyer.marketplace.safetyEquipment') },
  ];

  return (
    <div
      className="min-h-[calc(100vh-64px)] transition-colors"
      style={{ backgroundColor: styles.bgPrimary }}
    >
      <Container variant="full">
        <PageHeader
          title={t('buyer.marketplace.title')}
          subtitle={t('buyer.marketplace.subtitle')}
        />

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-md border transition-colors"
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
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-md border transition-colors"
            style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = styles.bgCard;
            }}
          >
            <Funnel size={16} style={{ color: styles.textSecondary }} />
            <span className="text-sm font-medium" style={{ color: styles.textSecondary }}>
              {t('common.filters')}
            </span>
          </button>

          <div
            className="flex items-center rounded-md border overflow-hidden"
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
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <CategoryChip key={cat.key} label={cat.label} active={cat.key === 'all'} />
          ))}
        </div>

        {/* Product Grid */}
        <div
          className={`grid gap-4 pb-8 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {/* Empty state for structure */}
          <ProductCard viewMode={viewMode} />
          <ProductCard viewMode={viewMode} />
          <ProductCard viewMode={viewMode} />
          <ProductCard viewMode={viewMode} />
        </div>
      </Container>
    </div>
  );
};

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

const CategoryChip: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => {
  const { styles } = usePortal();

  return (
    <button
      className="px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
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

const ProductCard: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  const { styles } = usePortal();

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-4 p-4 rounded-lg border transition-colors"
        style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
      >
        <div
          className="w-20 h-20 rounded-md flex-shrink-0"
          style={{ backgroundColor: styles.bgSecondary }}
        />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-48 rounded" style={{ backgroundColor: styles.bgActive }} />
          <div className="h-3 w-32 rounded mt-2" style={{ backgroundColor: styles.bgSecondary }} />
        </div>
        <div className="text-right">
          <div className="h-4 w-20 rounded" style={{ backgroundColor: styles.bgActive }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border overflow-hidden transition-colors"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      <div className="aspect-square" style={{ backgroundColor: styles.bgSecondary }} />
      <div className="p-4">
        <div className="h-4 w-3/4 rounded" style={{ backgroundColor: styles.bgActive }} />
        <div className="h-3 w-1/2 rounded mt-2" style={{ backgroundColor: styles.bgSecondary }} />
        <div className="h-4 w-1/3 rounded mt-3" style={{ backgroundColor: styles.bgActive }} />
      </div>
    </div>
  );
};

export default Marketplace;
