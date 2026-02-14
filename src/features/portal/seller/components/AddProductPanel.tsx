import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Package,
  Tag,
  Cube,
  Info,
  Image as ImageIcon,
  CloudArrowUp,
  Trash,
  CheckCircle,
  Lightning,
  Eye,
  EyeSlash,
  Calendar,
  Plus,
  Minus,
  Sparkle,
  WarningCircle,
  CaretRight,
  Gauge,
  FloppyDisk,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Select } from '../../components';

interface EditProduct {
  id: string;
  name: string;
  sku: string;
  partNumber: string;
  description: string;
  price: string;
  currency: string;
  stock: number;
  minOrderQty: number;
  category: string;
  manufacturer: string;
  brand: string;
  weight: string;
  weightUnit: string;
  dimensions: string;
  material: string;
  status: 'active' | 'draft' | 'out_of_stock';
  visibility: 'public' | 'hidden' | 'rfq_only';
  image: string | null;
}

interface AddProductPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductFormData) => void;
  editProduct?: EditProduct | null;
  onUpdate?: (id: string, data: Partial<EditProduct>) => void;
}

export interface ProductVariant {
  id: string;
  type: 'size' | 'color' | 'type';
  value: string;
  priceModifier: number;
  stock: number;
}

export interface ProductFormData {
  // Basic Info
  name: string;
  sku: string;
  description: string;
  // Pricing & Inventory
  price: string;
  currency: string;
  priceUnit: string;
  stock: string;
  minOrderQty: string;
  // Product Details
  category: string;
  manufacturer: string;
  partNumber: string;
  brand: string;
  // Specifications
  weight: string;
  weightUnit: string;
  dimensions: string;
  material: string;
  // Status & Visibility
  status: 'active' | 'draft';
  visibility: 'publish' | 'draft' | 'scheduled';
  scheduledDate?: string;
  // Variants
  hasVariants: boolean;
  variants: ProductVariant[];
  // Images
  image: string | null;
  marketplaceImage: string | null;
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  price: '',
  currency: 'SAR',
  priceUnit: 'per_unit',
  stock: '',
  minOrderQty: '1',
  category: '',
  manufacturer: '',
  partNumber: '',
  brand: '',
  weight: '',
  weightUnit: 'kg',
  dimensions: '',
  material: '',
  status: 'draft',
  visibility: 'publish', // Default to publish so items are visible in marketplace
  scheduledDate: '',
  hasVariants: false,
  variants: [],
  image: null,
  marketplaceImage: null,
};

// Category keys for translation
const categoryKeys = [
  'category.machinery',
  'category.spareParts',
  'category.electronics',
  'category.hydraulics',
  'category.pneumatics',
  'category.bearings',
  'category.motors',
  'category.pumps',
  'category.valves',
  'category.safetyEquipment',
];

// Category suggestion based on keywords
const categoryKeywords: Record<string, string[]> = {
  'category.bearings': ['bearing', 'ball', 'roller', '6303', '6203', '6205', 'skf', 'nsk', 'fag'],
  'category.motors': ['motor', 'drive', 'servo', 'stepper', 'ac', 'dc', 'rpm'],
  'category.pumps': ['pump', 'hydraulic', 'centrifugal', 'diaphragm', 'gear'],
  'category.valves': ['valve', 'solenoid', 'gate', 'ball', 'check', 'relief'],
  'category.electronics': ['sensor', 'plc', 'controller', 'relay', 'switch', 'display'],
  'category.hydraulics': ['hydraulic', 'cylinder', 'hose', 'fitting', 'manifold'],
  'category.pneumatics': ['pneumatic', 'air', 'compressor', 'fitting', 'tube'],
  'category.machinery': ['machine', 'cnc', 'lathe', 'mill', 'press', 'conveyor'],
  'category.spareParts': ['part', 'spare', 'replacement', 'component', 'kit'],
  'category.safetyEquipment': ['safety', 'helmet', 'glove', 'goggles', 'vest', 'harness'],
};

// Generate SKU from product data
const generateSKU = (name: string, category: string, manufacturer: string): string => {
  const prefix = category ? category.split('.')[1]?.substring(0, 3).toUpperCase() || 'PRD' : 'PRD';
  const mfrCode = manufacturer ? manufacturer.substring(0, 3).toUpperCase() : 'GEN';
  const nameCode =
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 3)
      .toUpperCase() || 'XXX';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${mfrCode}-${nameCode}-${random}`;
};

// Suggest category based on product name
const suggestCategory = (name: string): string | null => {
  const lowerName = name.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lowerName.includes(kw))) {
      return category;
    }
  }
  return null;
};

// Draft storage key
const DRAFT_STORAGE_KEY = 'portal-product-draft-v1';

// Readiness Score Calculator
interface ReadinessScore {
  total: number;
  visibility: number;
  rfqAttractiveness: number;
  searchCompleteness: number;
  breakdown: {
    label: string;
    score: number;
    maxScore: number;
    tips: string[];
  }[];
}

const calculateReadinessScore = (formData: ProductFormData): ReadinessScore => {
  // Visibility Score (30 points max)
  let visibilityScore = 0;
  const visibilityTips: string[] = [];

  if (formData.name.length > 10) visibilityScore += 10;
  else visibilityTips.push('Use a descriptive product name (10+ characters)');

  if (formData.image) visibilityScore += 10;
  else visibilityTips.push('Add a product image');

  if (formData.category) visibilityScore += 5;
  else visibilityTips.push('Select a category');

  if (formData.description.length > 50) visibilityScore += 5;
  else visibilityTips.push('Add a detailed description (50+ characters)');

  // RFQ Attractiveness Score (40 points max)
  let rfqScore = 0;
  const rfqTips: string[] = [];

  if (formData.price && parseFloat(formData.price) > 0) rfqScore += 15;
  else rfqTips.push('Set a competitive price');

  if (formData.stock && parseInt(formData.stock) > 0) rfqScore += 10;
  else rfqTips.push('Add stock quantity');

  if (formData.minOrderQty) rfqScore += 5;

  if (formData.manufacturer) rfqScore += 5;
  else rfqTips.push('Specify the manufacturer');

  if (formData.partNumber) rfqScore += 5;
  else rfqTips.push('Add a part number for easier identification');

  // Search Completeness Score (30 points max)
  let searchScore = 0;
  const searchTips: string[] = [];

  if (formData.sku) searchScore += 10;
  else searchTips.push('Add SKU for better search results');

  if (formData.brand) searchScore += 5;
  else searchTips.push('Specify the brand');

  if (formData.weight || formData.dimensions) searchScore += 5;

  if (formData.material) searchScore += 5;
  else searchTips.push('Add material specification');

  if (formData.category && formData.manufacturer) searchScore += 5;

  const total = visibilityScore + rfqScore + searchScore;

  return {
    total,
    visibility: visibilityScore,
    rfqAttractiveness: rfqScore,
    searchCompleteness: searchScore,
    breakdown: [
      { label: 'Visibility', score: visibilityScore, maxScore: 30, tips: visibilityTips },
      { label: 'RFQ Attractiveness', score: rfqScore, maxScore: 40, tips: rfqTips },
      { label: 'Search Completeness', score: searchScore, maxScore: 30, tips: searchTips },
    ],
  };
};

export const AddProductPanel: React.FC<AddProductPanelProps> = ({ isOpen, onClose, onSave, editProduct, onUpdate }) => {
  const { styles, t, direction } = usePortal();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const isEditing = !!editProduct;

  // Progressive Disclosure State
  const [_showAdvancedFields, _setShowAdvancedFields] = useState(false);
  const [_expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basicInfo: true,
    pricing: true,
    details: false,
    variants: false,
    specs: false,
    images: false,
    visibility: false,
  });

  // Draft Auto-Save State
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [showReadinessPanel, setShowReadinessPanel] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate readiness score
  const readinessScore = useMemo(() => calculateReadinessScore(formData), [formData]);

  // Auto-save draft
  const saveDraftToStorage = useCallback(() => {
    if (!isEditing && formData.name) {
      setIsDraftSaving(true);
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          data: formData,
          timestamp: new Date().toISOString(),
        }),
      );
      setLastSaved(new Date());
      setTimeout(() => setIsDraftSaving(false), 500);
    }
  }, [formData, isEditing]);

  // Auto-save on form changes (debounced)
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (formData.name && !isEditing) {
        saveDraftToStorage();
      }
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, saveDraftToStorage, isEditing]);

  // Load draft on mount
  useEffect(() => {
    if (!isEditing && isOpen) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const { data, timestamp } = JSON.parse(savedDraft);
          const savedDate = new Date(timestamp);
          const now = new Date();
          // Only restore if draft is less than 24 hours old
          if (now.getTime() - savedDate.getTime() < 24 * 60 * 60 * 1000) {
            setFormData(data);
            setLastSaved(savedDate);
          }
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
  }, [isEditing, isOpen]);

  // Clear draft on successful save
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setLastSaved(null);
  }, []);

  // Toggle section expansion
  const _toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Populate form when editing
  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name,
        sku: editProduct.sku,
        description: editProduct.description || '',
        price: editProduct.price,
        currency: editProduct.currency,
        priceUnit: editProduct.priceUnit || 'per_unit',
        stock: String(editProduct.stock),
        minOrderQty: String(editProduct.minOrderQty),
        category: editProduct.category,
        manufacturer: editProduct.manufacturer || '',
        brand: editProduct.brand || '',
        partNumber: editProduct.partNumber || '',
        weight: editProduct.weight || '',
        weightUnit: editProduct.weightUnit || 'kg',
        dimensions: editProduct.dimensions || '',
        material: editProduct.material || '',
        status: editProduct.status === 'out_of_stock' ? 'draft' : editProduct.status,
        visibility: editProduct.visibility === 'public' ? 'publish' : 'draft',
        scheduledDate: '',
        hasVariants: false,
        variants: [],
        image: editProduct.image,
        marketplaceImage: null,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editProduct]);

  // Calculate completeness
  const completeness = useMemo(() => {
    const requiredFields = ['name', 'sku', 'price', 'stock', 'category'];
    const optionalFields = [
      'description',
      'manufacturer',
      'brand',
      'weight',
      'dimensions',
      'material',
      'partNumber',
      'image',
    ];

    const requiredComplete = requiredFields.filter((f) => {
      const val = formData[f as keyof ProductFormData];
      return val && val !== '';
    }).length;

    const optionalComplete = optionalFields.filter((f) => {
      const val = formData[f as keyof ProductFormData];
      return val && val !== '';
    }).length;

    const total = requiredFields.length + optionalFields.length;
    const completed = requiredComplete + optionalComplete;
    const percentage = Math.round((completed / total) * 100);

    const missingRequired = requiredFields.filter((f) => {
      const val = formData[f as keyof ProductFormData];
      return !val || val === '';
    });

    return {
      percentage,
      requiredComplete,
      requiredTotal: requiredFields.length,
      isComplete: requiredComplete === requiredFields.length,
      missingRequired,
    };
  }, [formData]);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Auto-suggest category when name changes
  useEffect(() => {
    if (formData.name && !formData.category) {
      const suggested = suggestCategory(formData.name);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [formData.name, formData.category]);

  const handleChange = (field: keyof ProductFormData, value: string | boolean | ProductVariant[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoGenerateSKU = () => {
    const sku = generateSKU(formData.name, formData.category, formData.manufacturer);
    handleChange('sku', sku);
  };

  const handleApplySuggestedCategory = () => {
    if (suggestedCategory) {
      handleChange('category', suggestedCategory);
      setSuggestedCategory(null);
    }
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      type: 'size',
      value: '',
      priceModifier: 0,
      stock: 0,
    };
    handleChange('variants', [...formData.variants, newVariant]);
  };

  const handleUpdateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    const updated = formData.variants.map((v) => (v.id === id ? { ...v, [field]: value } : v));
    handleChange('variants', updated);
  };

  const handleRemoveVariant = (id: string) => {
    handleChange(
      'variants',
      formData.variants.filter((v) => v.id !== id),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStatus = formData.visibility === 'publish' ? 'active' : 'draft';

    if (isEditing && editProduct && onUpdate) {
      onUpdate(editProduct.id, {
        name: formData.name,
        sku: formData.sku,
        partNumber: formData.partNumber,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        stock: parseInt(formData.stock) || 0,
        minOrderQty: parseInt(formData.minOrderQty) || 1,
        category: formData.category,
        manufacturer: formData.manufacturer,
        brand: formData.brand,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        dimensions: formData.dimensions,
        material: formData.material,
        status: finalStatus as 'active' | 'draft',
        visibility: formData.visibility === 'publish' ? 'public' : 'hidden',
        image: formData.image,
      });
    } else {
      onSave({ ...formData, status: finalStatus });
    }
    clearDraft(); // Clear auto-saved draft on successful submit
    setFormData(initialFormData);
    onClose();
  };

  const handleSaveDraft = () => {
    if (isEditing && editProduct && onUpdate) {
      onUpdate(editProduct.id, {
        name: formData.name,
        sku: formData.sku,
        partNumber: formData.partNumber,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        priceUnit: formData.priceUnit,
        stock: parseInt(formData.stock) || 0,
        minOrderQty: parseInt(formData.minOrderQty) || 1,
        category: formData.category,
        manufacturer: formData.manufacturer,
        brand: formData.brand,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        dimensions: formData.dimensions,
        material: formData.material,
        status: 'draft',
        visibility: 'hidden',
        image: formData.image,
      });
    } else {
      onSave({ ...formData, status: 'draft', visibility: 'draft' });
    }
    clearDraft(); // Clear auto-saved draft
    setFormData(initialFormData);
    onClose();
  };

  if (!isVisible) return null;

  const isRtl = direction === 'rtl';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30" style={{ top: '64px' }} onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed z-40 w-[70%] max-w-4xl overflow-hidden flex flex-col"
        style={{
          top: '64px',
          bottom: 0,
          backgroundColor: styles.bgPrimary,
          borderLeft: `2px solid ${styles.border}`,
          boxShadow: styles.isDark ? '-12px 0 40px rgba(0, 0, 0, 0.6)' : '-8px 0 30px rgba(0, 0, 0, 0.1)',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          borderLeftWidth: isRtl ? 0 : 1,
          borderRightWidth: isRtl ? 1 : 0,
          transform: isAnimating ? 'translateX(0)' : isRtl ? 'translateX(-100%)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        dir={direction}
      >
        {/* Header with Completeness & Readiness */}
        <div className="flex flex-col border-b shrink-0" style={{ borderColor: styles.border }}>
          {/* Animated Progress Bar - Top Strip */}
          <div className="relative h-1.5 w-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
            {/* Background segments for visual guide */}
            <div className="absolute inset-0 flex">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    borderRight: i < 4 ? `1px solid ${styles.bgPrimary}` : 'none',
                  }}
                />
              ))}
            </div>
            {/* Animated fill bar */}
            <div
              className="absolute inset-y-0 left-0 rounded-r-full"
              style={{
                width: `${completeness.percentage}%`,
                background: completeness.isComplete
                  ? `linear-gradient(90deg, #22C55E 0%, #16A34A 100%)`
                  : completeness.percentage >= 60
                    ? `linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)`
                    : `linear-gradient(90deg, #F59E0B 0%, #D97706 100%)`,
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
                boxShadow: completeness.isComplete
                  ? '0 0 12px rgba(34, 197, 94, 0.5)'
                  : completeness.percentage >= 60
                    ? '0 0 12px rgba(59, 130, 246, 0.4)'
                    : '0 0 8px rgba(245, 158, 11, 0.3)',
              }}
            />
            {/* Shimmer effect on the progress bar */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-r-full"
              style={{
                width: `${completeness.percentage}%`,
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animation: 'shimmer 2s infinite',
                  animationTimingFunction: 'ease-in-out',
                }}
              />
            </div>
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
              }
            `}</style>
          </div>

          {/* Header Content */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {isEditing ? t('seller.listings.editProduct') : t('seller.listings.addProduct')}
                </h2>
                {/* Completeness Badge with animated counter */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: completeness.isComplete
                      ? styles.isDark
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(34, 197, 94, 0.1)'
                      : completeness.percentage >= 60
                        ? styles.isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(59, 130, 246, 0.1)'
                        : styles.isDark
                          ? 'rgba(234, 179, 8, 0.15)'
                          : 'rgba(234, 179, 8, 0.1)',
                    color: completeness.isComplete
                      ? styles.success
                      : completeness.percentage >= 60
                        ? styles.info
                        : '#EAB308',
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                  }}
                >
                  {completeness.isComplete ? (
                    <CheckCircle size={12} weight="fill" />
                  ) : (
                    <WarningCircle size={12} weight="fill" />
                  )}
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{completeness.percentage}%</span>
                  {t('addProduct.complete')}
                </div>
                {/* Readiness Score Badge */}
                <button
                  onClick={() => setShowReadinessPanel(!showReadinessPanel)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor:
                      readinessScore.total >= 80
                        ? styles.isDark
                          ? 'rgba(34, 197, 94, 0.15)'
                          : 'rgba(34, 197, 94, 0.1)'
                        : readinessScore.total >= 50
                          ? styles.isDark
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(59, 130, 246, 0.1)'
                          : styles.isDark
                            ? 'rgba(234, 179, 8, 0.15)'
                            : 'rgba(234, 179, 8, 0.1)',
                    color:
                      readinessScore.total >= 80
                        ? styles.success
                        : readinessScore.total >= 50
                          ? styles.info
                          : '#EAB308',
                  }}
                >
                  <Gauge size={12} weight="fill" />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{readinessScore.total}/100</span>
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {completeness.isComplete
                    ? t('addProduct.readyToPublish')
                    : `${t('addProduct.missing')}: ${completeness.missingRequired.join(', ')}`}
                </p>
                {/* Draft Auto-Save Indicator */}
                {lastSaved && !isEditing && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: styles.textMuted }}>
                    {isDraftSaving ? (
                      <>
                        <FloppyDisk size={10} className="animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={10} weight="fill" style={{ color: styles.success }} />
                        Draft saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Readiness Panel Toggle */}
              <button
                onClick={() => setShowReadinessPanel(!showReadinessPanel)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors`}
                style={{
                  backgroundColor: showReadinessPanel ? styles.bgActive : styles.bgSecondary,
                  color: showReadinessPanel ? styles.textPrimary : styles.textSecondary,
                }}
              >
                <Gauge size={14} />
                {t('addProduct.readinessScore') || 'Readiness'}
              </button>

              {/* Preview Toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors`}
                style={{
                  backgroundColor: showPreview ? styles.bgActive : styles.bgSecondary,
                  color: showPreview ? styles.textPrimary : styles.textSecondary,
                }}
              >
                {showPreview ? <EyeSlash size={14} /> : <Eye size={14} />}
                {t('addProduct.preview')}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-md transition-colors"
                style={{ color: styles.textSecondary }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Readiness Score Panel */}
        {showReadinessPanel && (
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
          >
            <div className="flex items-start gap-6">
              {/* Overall Score */}
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    backgroundColor:
                      readinessScore.total >= 80
                        ? styles.isDark
                          ? 'rgba(34, 197, 94, 0.2)'
                          : 'rgba(34, 197, 94, 0.15)'
                        : readinessScore.total >= 50
                          ? styles.isDark
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(59, 130, 246, 0.15)'
                          : styles.isDark
                            ? 'rgba(234, 179, 8, 0.2)'
                            : 'rgba(234, 179, 8, 0.15)',
                    color:
                      readinessScore.total >= 80
                        ? styles.success
                        : readinessScore.total >= 50
                          ? styles.info
                          : '#EAB308',
                  }}
                >
                  {readinessScore.total}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: styles.textPrimary }}>
                    {readinessScore.total >= 80 ? 'Excellent' : readinessScore.total >= 50 ? 'Good' : 'Needs Work'}
                  </p>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    {readinessScore.total >= 80 ? 'Ready to attract buyers' : 'Add more details to improve'}
                  </p>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="flex-1 grid grid-cols-3 gap-4">
                {readinessScore.breakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
                        {item.label}
                      </span>
                      <span className="text-xs" style={{ color: styles.textMuted }}>
                        {item.score}/{item.maxScore}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgPrimary }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(item.score / item.maxScore) * 100}%`,
                          backgroundColor:
                            item.score >= item.maxScore * 0.8
                              ? styles.success
                              : item.score >= item.maxScore * 0.5
                                ? styles.info
                                : '#EAB308',
                        }}
                      />
                    </div>
                    {item.tips.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                        {item.tips[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Form Content */}
          <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto ${showPreview ? 'w-1/2' : 'w-full'}`}>
            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <Section icon={Package} title={t('addProduct.basicInfo')} styles={styles}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t('addProduct.productName')} required styles={styles} className="col-span-2">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder={t('addProduct.productNamePlaceholder')}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none transition-colors"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                      required
                    />
                  </FormField>

                  <FormField label={t('addProduct.sku')} required styles={styles}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                        placeholder={t('addProduct.skuPlaceholder')}
                        className={`flex-1 min-w-0 px-3 py-2.5 rounded-md border text-sm outline-none transition-colors ${isRtl ? 'order-2' : 'order-1'}`}
                        style={{
                          borderColor: styles.border,
                          backgroundColor: styles.bgCard,
                          color: styles.textPrimary,
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleAutoGenerateSKU}
                        className={`shrink-0 px-3 py-2.5 rounded-md border text-sm transition-colors flex items-center gap-1 ${isRtl ? 'order-1' : 'order-2'}`}
                        style={{
                          borderColor: styles.border,
                          backgroundColor: styles.bgSecondary,
                          color: styles.textSecondary,
                        }}
                        title={t('addProduct.autoGenerateSku')}
                      >
                        <Sparkle size={14} />
                        {t('addProduct.auto')}
                      </button>
                    </div>
                  </FormField>

                  <FormField label={t('addProduct.partNumber')} styles={styles}>
                    <input
                      type="text"
                      value={formData.partNumber}
                      onChange={(e) => handleChange('partNumber', e.target.value)}
                      placeholder={t('addProduct.partNumberPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none transition-colors"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>

                  <FormField label={t('addProduct.description')} styles={styles} className="col-span-2">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder={t('addProduct.descriptionPlaceholder')}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none resize-none transition-colors"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>
                </div>
              </Section>

              {/* Pricing & Inventory */}
              <Section icon={Tag} title={t('addProduct.pricingInventory')} styles={styles}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t('addProduct.price')} required styles={styles}>
                    <div className="flex w-full" dir="ltr">
                      <select
                        value={formData.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className="px-3 py-2.5 border border-r-0 rounded-l-md text-sm outline-none shrink-0"
                        style={{
                          borderColor: styles.border,
                          backgroundColor: styles.bgSecondary,
                          color: styles.textSecondary,
                        }}
                      >
                        <option value="SAR">{t('addProduct.currencySAR')}</option>
                        <option value="USD">{t('addProduct.currencyUSD')}</option>
                        <option value="EUR">{t('addProduct.currencyEUR')}</option>
                        <option value="AED">{t('addProduct.currencyAED')}</option>
                      </select>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="flex-1 min-w-0 px-3 py-2.5 border rounded-r-md text-sm outline-none"
                        style={{
                          borderColor: styles.border,
                          backgroundColor: styles.bgCard,
                          color: styles.textPrimary,
                        }}
                        required
                      />
                    </div>
                  </FormField>

                  <FormField label={t('addProduct.unitOfMeasure')} styles={styles}>
                    <select
                      value={formData.priceUnit}
                      onChange={(e) => handleChange('priceUnit', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    >
                      <option value="per_unit">{t('addProduct.uomPerUnit')}</option>
                      <option value="per_kg">{t('addProduct.uomPerKg')}</option>
                      <option value="per_meter">{t('addProduct.uomPerMeter')}</option>
                      <option value="per_liter">{t('addProduct.uomPerLiter')}</option>
                      <option value="per_set">{t('addProduct.uomPerSet')}</option>
                      <option value="per_box">{t('addProduct.uomPerBox')}</option>
                    </select>
                  </FormField>

                  <FormField label={t('addProduct.stockQuantity')} required styles={styles}>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleChange('stock', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                      required
                    />
                  </FormField>

                  <FormField label={t('addProduct.minOrderQty')} styles={styles}>
                    <input
                      type="number"
                      value={formData.minOrderQty}
                      onChange={(e) => handleChange('minOrderQty', e.target.value)}
                      placeholder="1"
                      min="1"
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>
                </div>
              </Section>

              {/* Product Details */}
              <Section icon={Cube} title={t('addProduct.productDetails')} styles={styles}>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t('addProduct.category')} required styles={styles}>
                    <div className="space-y-2">
                      <Select
                        value={formData.category}
                        onChange={(value) => handleChange('category', value)}
                        options={categoryKeys.map((catKey) => ({
                          value: catKey,
                          label: t(catKey),
                        }))}
                        placeholder={t('addProduct.selectCategory')}
                        className="w-full"
                      />
                      {/* Category Suggestion */}
                      {suggestedCategory && (
                        <button
                          type="button"
                          onClick={handleApplySuggestedCategory}
                          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
                          style={{
                            backgroundColor: styles.isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                            color: '#8B5CF6',
                          }}
                        >
                          <Sparkle size={12} />
                          {t('addProduct.suggested')}: {t(suggestedCategory)} — {t('addProduct.clickToApply')}
                        </button>
                      )}
                    </div>
                  </FormField>

                  <FormField label={t('addProduct.manufacturer')} styles={styles}>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => handleChange('manufacturer', e.target.value)}
                      placeholder={t('addProduct.manufacturerPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>

                  <FormField label={t('addProduct.brand')} styles={styles}>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder={t('addProduct.brandPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>
                </div>
              </Section>

              {/* Product Variants - Collapsible Advanced Section */}
              <Section
                icon={Tag}
                title={t('addProduct.productVariants')}
                styles={styles}
                collapsible
                defaultExpanded={formData.hasVariants}
                badge={t('addProduct.advanced') || 'Advanced'}
              >
                <div className="space-y-4">
                  {/* Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{
                        backgroundColor: formData.hasVariants ? styles.success : styles.bgSecondary,
                      }}
                      onClick={() => handleChange('hasVariants', !formData.hasVariants)}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow"
                        style={{
                          transform: formData.hasVariants ? 'translateX(22px)' : 'translateX(2px)',
                        }}
                      />
                    </div>
                    <span className="text-sm" style={{ color: styles.textPrimary }}>
                      {t('addProduct.hasVariantsDesc')}
                    </span>
                  </label>

                  {/* Variants List */}
                  {formData.hasVariants && (
                    <div className="space-y-3">
                      {formData.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="grid grid-cols-5 gap-2 items-center p-3 rounded-lg border"
                          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
                        >
                          <Select
                            value={variant.type}
                            onChange={(value) => handleUpdateVariant(variant.id, 'type', value)}
                            options={[
                              { value: 'size', label: t('addProduct.variantSize') },
                              { value: 'color', label: t('addProduct.variantColor') },
                              { value: 'type', label: t('addProduct.variantType') },
                            ]}
                            className="min-w-[100px]"
                          />
                          <input
                            type="text"
                            placeholder={t('addProduct.variantValue')}
                            value={variant.value}
                            onChange={(e) => handleUpdateVariant(variant.id, 'value', e.target.value)}
                            className="px-2 py-1.5 rounded border text-sm"
                            style={{
                              borderColor: styles.border,
                              backgroundColor: styles.bgCard,
                              color: styles.textPrimary,
                            }}
                          />
                          <input
                            type="number"
                            placeholder={t('addProduct.variantPriceModifier')}
                            value={variant.priceModifier || ''}
                            onChange={(e) =>
                              handleUpdateVariant(variant.id, 'priceModifier', parseFloat(e.target.value) || 0)
                            }
                            className="px-2 py-1.5 rounded border text-sm"
                            style={{
                              borderColor: styles.border,
                              backgroundColor: styles.bgCard,
                              color: styles.textPrimary,
                            }}
                          />
                          <input
                            type="number"
                            placeholder={t('addProduct.variantStock')}
                            value={variant.stock || ''}
                            onChange={(e) => handleUpdateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                            className="px-2 py-1.5 rounded border text-sm"
                            style={{
                              borderColor: styles.border,
                              backgroundColor: styles.bgCard,
                              color: styles.textPrimary,
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(variant.id)}
                            className="p-1.5 rounded transition-colors justify-self-center"
                            style={{ color: styles.error }}
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddVariant}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-colors w-full justify-center border border-dashed"
                        style={{
                          borderColor: styles.border,
                          color: styles.textSecondary,
                        }}
                      >
                        <Plus size={14} />
                        {t('addProduct.addVariant')}
                      </button>
                    </div>
                  )}
                </div>
              </Section>

              {/* Specifications - Collapsible Advanced Section */}
              <Section
                icon={Info}
                title={t('addProduct.specifications')}
                styles={styles}
                collapsible
                defaultExpanded={!!(formData.weight || formData.dimensions || formData.material)}
                badge={t('addProduct.advanced') || 'Advanced'}
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField label={t('addProduct.weight')} styles={styles}>
                    <div className="flex w-full" dir="ltr">
                      <select
                        value={formData.weightUnit}
                        onChange={(e) => handleChange('weightUnit', e.target.value)}
                        className="px-3 py-2.5 border border-r-0 rounded-l-md text-sm outline-none shrink-0"
                        style={{
                          borderColor: styles.border,
                          backgroundColor: styles.bgSecondary,
                          color: styles.textSecondary,
                        }}
                      >
                        <option value="kg">{t('addProduct.weightKg')}</option>
                        <option value="lb">{t('addProduct.weightLb')}</option>
                        <option value="g">{t('addProduct.weightG')}</option>
                      </select>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleChange('weight', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="flex-1 min-w-0 px-3 py-2.5 border rounded-r-md text-sm outline-none"
                        style={{
                          borderColor: styles.border,
                          backgroundColor: styles.bgCard,
                          color: styles.textPrimary,
                        }}
                      />
                    </div>
                  </FormField>

                  <FormField label={t('addProduct.dimensions')} styles={styles}>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => handleChange('dimensions', e.target.value)}
                      placeholder={t('addProduct.dimensionsPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      dir="ltr"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>

                  <FormField label={t('addProduct.material')} styles={styles}>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => handleChange('material', e.target.value)}
                      placeholder={t('addProduct.materialPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </FormField>
                </div>
              </Section>

              {/* Product Images */}
              <Section icon={ImageIcon} title={t('addProduct.productImage')} styles={styles}>
                <div className="space-y-6">
                  {/* Main Product Image */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {t('addProduct.mainProductImage')}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
                      >
                        {t('addProduct.catalog')}
                      </span>
                    </div>
                    <ImageUploader
                      styles={styles}
                      value={formData.image}
                      onChange={(img) => handleChange('image', img || '')}
                      t={t}
                      isRtl={isRtl}
                      variant="product"
                    />
                  </div>

                  {/* Marketplace View Image */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {t('addProduct.marketplaceBanner')}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: styles.isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                          color: '#8B5CF6',
                        }}
                      >
                        {t('addProduct.featured')}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: styles.textMuted }}>
                      {t('addProduct.marketplaceBannerDesc')}
                    </p>
                    <ImageUploader
                      styles={styles}
                      value={formData.marketplaceImage}
                      onChange={(img) => handleChange('marketplaceImage', img || '')}
                      t={t}
                      isRtl={isRtl}
                      variant="marketplace"
                    />
                  </div>
                </div>
              </Section>

              {/* Visibility */}
              <Section icon={Eye} title={t('addProduct.visibilitySection')} styles={styles}>
                <div className="grid grid-cols-3 gap-3">
                  <VisibilityOption
                    icon={Lightning}
                    label={t('addProduct.publishNow')}
                    description={t('addProduct.immediatelyVisible')}
                    selected={formData.visibility === 'publish'}
                    onClick={() => handleChange('visibility', 'publish')}
                    styles={styles}
                  />
                  <VisibilityOption
                    icon={EyeSlash}
                    label={t('addProduct.saveDraft')}
                    description={t('addProduct.hiddenFromBuyers')}
                    selected={formData.visibility === 'draft'}
                    onClick={() => handleChange('visibility', 'draft')}
                    styles={styles}
                  />
                  <VisibilityOption
                    icon={Calendar}
                    label={t('addProduct.schedule')}
                    description={t('addProduct.publishLater')}
                    selected={formData.visibility === 'scheduled'}
                    onClick={() => handleChange('visibility', 'scheduled')}
                    styles={styles}
                  />
                </div>
                {formData.visibility === 'scheduled' && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={formData.scheduledDate || ''}
                      onChange={(e) => handleChange('scheduledDate', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-md border text-sm outline-none"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgCard,
                        color: styles.textPrimary,
                      }}
                    />
                  </div>
                )}
              </Section>
            </div>
          </form>

          {/* Live Preview */}
          {showPreview && (
            <div
              className={`w-1/2 overflow-y-auto p-6 ${isRtl ? 'border-r' : 'border-l'}`}
              style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
            >
              <div className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: styles.textMuted }}>
                {t('addProduct.livePreview')}
              </div>
              <ProductPreview formData={formData} styles={styles} t={t} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-md border transition-colors"
            style={{
              borderColor: styles.border,
              color: styles.textSecondary,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2.5 text-sm font-medium rounded-md border transition-colors"
            style={{
              borderColor: styles.border,
              color: styles.textSecondary,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {t('addProduct.saveDraft')}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!completeness.isComplete}
            className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
            style={{
              backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
              color: styles.isDark ? '#0F1115' : '#E6E8EB',
            }}
          >
            {isEditing
              ? t('common.save')
              : formData.visibility === 'scheduled'
                ? t('addProduct.schedule')
                : t('addProduct.publish')}
          </button>
        </div>
      </div>
    </>
  );
};

// Live Product Preview
const ProductPreview: React.FC<{
  formData: ProductFormData;
  styles: ReturnType<typeof usePortal>['styles'];
  t: (key: string) => string;
}> = ({ formData, styles, t }) => {
  const formattedPrice = formData.price
    ? `${formData.currency} ${parseFloat(formData.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : '-';

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
    >
      {/* Image */}
      <div className="h-48 flex items-center justify-center" style={{ backgroundColor: styles.bgSecondary }}>
        {formData.image ? (
          <img src={formData.image} alt="Preview" className="h-full w-full object-contain" />
        ) : (
          <Cube size={48} style={{ color: styles.textMuted }} />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold" style={{ color: styles.textPrimary }}>
            {formData.name || 'Product Name'}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
            SKU: {formData.sku || '-'} {formData.partNumber && `• P/N: ${formData.partNumber}`}
          </p>
        </div>

        <div className="text-lg font-bold" style={{ color: styles.textPrimary }}>
          {formattedPrice}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
          >
            {formData.category ? t(formData.category) : 'Category'}
          </span>
          <span style={{ color: styles.textMuted }}>Stock: {formData.stock || '0'}</span>
        </div>

        {formData.description && (
          <p className="text-xs line-clamp-3" style={{ color: styles.textSecondary }}>
            {formData.description}
          </p>
        )}

        {formData.variants.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {formData.variants.map((v) => (
              <span
                key={v.id}
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: styles.bgSecondary, color: styles.textMuted }}
              >
                {v.type}: {v.value || '?'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Visibility Option Component
const VisibilityOption: React.FC<{
  icon: React.ElementType;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ icon: Icon, label, description, selected, onClick, styles }) => (
  <button
    type="button"
    onClick={onClick}
    className="p-3 rounded-lg border text-left transition-all"
    style={{
      borderColor: selected ? styles.success : styles.border,
      backgroundColor: selected
        ? styles.isDark
          ? 'rgba(34, 197, 94, 0.1)'
          : 'rgba(34, 197, 94, 0.05)'
        : 'transparent',
    }}
  >
    <Icon
      size={18}
      weight={selected ? 'fill' : 'regular'}
      style={{ color: selected ? styles.success : styles.textMuted }}
    />
    <div className="mt-2 text-sm font-medium" style={{ color: styles.textPrimary }}>
      {label}
    </div>
    <div className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
      {description}
    </div>
  </button>
);

// Section Component with Collapsible Support
interface SectionProps {
  icon: React.ElementType;
  title: string;
  styles: ReturnType<typeof usePortal>['styles'];
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  badge?: string;
  badgeColor?: string;
}

const Section: React.FC<SectionProps> = ({
  icon: Icon,
  title,
  styles,
  children,
  collapsible = false,
  defaultExpanded = true,
  badge,
  badgeColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 mb-4 w-full text-left ${collapsible ? 'cursor-pointer' : ''}`}
        disabled={!collapsible}
      >
        <Icon size={18} style={{ color: styles.textSecondary }} />
        <h3 className="text-sm font-semibold uppercase tracking-wide flex-1" style={{ color: styles.textSecondary }}>
          {title}
        </h3>
        {badge && (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: badgeColor || styles.bgSecondary, color: styles.textMuted }}
          >
            {badge}
          </span>
        )}
        {collapsible && (
          <CaretRight
            size={14}
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            style={{ color: styles.textMuted }}
          />
        )}
      </button>
      {(!collapsible || isExpanded) && children}
    </div>
  );
};

// FormField Component
interface FormFieldProps {
  label: string;
  required?: boolean;
  styles: ReturnType<typeof usePortal>['styles'];
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, styles, children, className }) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
      {label}
      {required && <span style={{ color: styles.error }}> *</span>}
    </label>
    {children}
  </div>
);

// Image Uploader Component
interface ImageUploaderProps {
  styles: ReturnType<typeof usePortal>['styles'];
  value: string | null;
  onChange: (image: string | null) => void;
  t: (key: string) => string;
  isRtl: boolean;
  variant?: 'product' | 'marketplace';
}

// Image specs by variant
const imageSpecs = {
  product: {
    recommended: '800 x 800 px',
    aspectRatio: '1:1 (Square)',
    maxSize: '5 MB',
    description: 'Use a clean, white or neutral background. Product should fill 80% of the frame.',
  },
  marketplace: {
    recommended: '1200 x 630 px',
    aspectRatio: '1.91:1 (Wide)',
    maxSize: '5 MB',
    description: 'Landscape format for marketplace grid. Include product name/branding for visibility.',
  },
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ styles, value, onChange, t, isRtl, variant = 'product' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeImage = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {!value ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragging ? 'scale-[1.02]' : ''
          }`}
          style={{
            borderColor: isDragging ? styles.success : styles.border,
            backgroundColor: isDragging ? (styles.isDark ? '#1B3D2F20' : '#E8F5E920') : 'transparent',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: styles.bgSecondary }}
          >
            <CloudArrowUp size={28} style={{ color: styles.textMuted }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: styles.textPrimary }}>
            {t('addProduct.dropImage')} <span style={{ color: styles.success }}>{t('addProduct.browse')}</span>
          </p>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {t('addProduct.dragDropUpload')}
          </p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
          <img
            src={value || ''}
            alt={variant === 'marketplace' ? 'Marketplace banner preview' : 'Product preview'}
            className={`w-full object-contain ${variant === 'marketplace' ? 'h-36' : 'h-48'}`}
          />
          <div className={`absolute top-3 flex gap-2 ${isRtl ? 'left-3' : 'right-3'}`}>
            <button
              type="button"
              onClick={removeImage}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: styles.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                color: styles.error,
              }}
            >
              <Trash size={18} />
            </button>
          </div>
          <div
            className={`absolute bottom-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${isRtl ? 'right-3' : 'left-3'}`}
            style={{
              backgroundColor: styles.isDark ? 'rgba(27, 61, 47, 0.9)' : 'rgba(220, 252, 231, 0.95)',
              color: styles.success,
            }}
          >
            <CheckCircle size={14} weight="fill" />
            {t('addProduct.uploaded')}
          </div>
        </div>
      )}

      <div className="rounded-lg p-4" style={{ backgroundColor: styles.bgSecondary }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: styles.textMuted }}>
          {variant === 'marketplace' ? t('addProduct.bannerRequirements') : t('addProduct.imageRequirements')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SpecItem label={t('addProduct.format')} value="PNG, JPG, WebP" styles={styles} />
          <SpecItem label={t('addProduct.maxSize')} value={imageSpecs[variant].maxSize} styles={styles} />
          <SpecItem label={t('addProduct.recommended')} value={imageSpecs[variant].recommended} styles={styles} />
          <SpecItem
            label={t('addProduct.aspectRatio')}
            value={variant === 'marketplace' ? t('addProduct.wide') : t('addProduct.square')}
            styles={styles}
          />
        </div>
        <p className="text-xs mt-3" style={{ color: styles.textMuted }}>
          {variant === 'marketplace' ? t('addProduct.marketplaceImageDesc') : t('addProduct.productImageDesc')}
        </p>
      </div>
    </div>
  );
};

// Spec Item Component
const SpecItem: React.FC<{
  label: string;
  value: string;
  styles: ReturnType<typeof usePortal>['styles'];
}> = ({ label, value, styles }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs" style={{ color: styles.textMuted }}>
      {label}
    </span>
    <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>
      {value}
    </span>
  </div>
);

export default AddProductPanel;
