import React, { useState, useEffect, useRef } from 'react';
import { X, Package, Tag, Cube, Info, Image as ImageIcon, CaretDown, CloudArrowUp, Trash, CheckCircle } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';

interface AddProductPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductFormData) => void;
}

export interface ProductFormData {
  // Basic Info
  name: string;
  sku: string;
  description: string;
  // Pricing & Inventory
  price: string;
  currency: string;
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
  // Status
  status: 'active' | 'draft';
  // Image
  image: string | null;
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  price: '',
  currency: 'USD',
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
  image: null,
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

export const AddProductPanel: React.FC<AddProductPanelProps> = ({ isOpen, onClose, onSave }) => {
  const { styles, t, direction } = usePortal();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData(initialFormData);
    onClose();
  };

  const handleSaveDraft = () => {
    onSave({ ...formData, status: 'draft' });
    setFormData(initialFormData);
    onClose();
  };

  if (!isVisible) return null;

  const isRtl = direction === 'rtl';

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 z-30"
        style={{
          top: '64px',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-40 w-[70%] max-w-4xl overflow-hidden flex flex-col border-l"
        style={{
          top: '64px', // Below the navbar
          bottom: 0,
          backgroundColor: styles.bgPrimary,
          borderColor: styles.border,
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          borderLeftWidth: isRtl ? 0 : 1,
          borderRightWidth: isRtl ? 1 : 0,
          transform: isAnimating
            ? 'translateX(0)'
            : isRtl
            ? 'translateX(-100%)'
            : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        dir={direction}
      >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: styles.border }}
      >
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
          >
            {t('seller.listings.addProduct')}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: styles.textMuted }}>
            {t('seller.listings.subtitle')}
          </p>
        </div>
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

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <Section icon={Package} title={t('addProduct.basicInfo')} styles={styles}>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t('addProduct.productName')}
                required
                styles={styles}
                className="col-span-2"
              >
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
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder={t('addProduct.skuPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-md border text-sm outline-none transition-colors"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgCard,
                    color: styles.textPrimary,
                  }}
                  required
                />
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
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
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
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none appearance-none ${isRtl ? 'pl-8' : 'pr-8'}`}
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgCard,
                      color: formData.category ? styles.textPrimary : styles.textMuted,
                    }}
                    required
                  >
                    <option value="">{t('addProduct.selectCategory')}</option>
                    {categoryKeys.map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {t(catKey)}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={16}
                    className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRtl ? 'left-3' : 'right-3'}`}
                    style={{ color: styles.textMuted }}
                  />
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

          {/* Specifications */}
          <Section icon={Info} title={t('addProduct.specifications')} styles={styles}>
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
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="g">g</option>
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
            <ImageUploader
              styles={styles}
              value={formData.image}
              onChange={(img) => handleChange('image', img || '')}
              t={t}
              isRtl={isRtl}
            />
          </Section>
        </div>
      </form>

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
          className="px-5 py-2.5 text-sm font-medium rounded-md transition-colors"
          style={{
            backgroundColor: styles.isDark ? '#E6E8EB' : '#0F1115',
            color: styles.isDark ? '#0F1115' : '#E6E8EB',
          }}
        >
          {t('addProduct.publish')}
        </button>
      </div>
    </div>
    </>
  );
};

// Section Component
interface SectionProps {
  icon: React.ElementType;
  title: string;
  styles: ReturnType<typeof usePortal>['styles'];
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, styles, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <Icon size={18} style={{ color: styles.textSecondary }} />
      <h3
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: styles.textSecondary }}
      >
        {title}
      </h3>
    </div>
    {children}
  </div>
);

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
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ styles, value, onChange, t, isRtl }) => {
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
      {/* Upload Area */}
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
        /* Image Preview */
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ backgroundColor: styles.bgSecondary }}
        >
          <img
            src={value || ''}
            alt="Product preview"
            className="w-full h-48 object-contain"
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

      {/* Image Specifications */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: styles.textMuted }}>
          {t('addProduct.imageRequirements')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <SpecItem label={t('addProduct.format')} value="PNG, JPG, WebP" styles={styles} />
          <SpecItem label={t('addProduct.maxSize')} value="5 MB" styles={styles} />
          <SpecItem label={t('addProduct.recommended')} value="800 x 800 px" styles={styles} />
          <SpecItem label={t('addProduct.aspectRatio')} value={t('addProduct.square')} styles={styles} />
        </div>
        <div
          className="mt-3 pt-3 border-t"
          style={{ borderColor: styles.border }}
        >
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {t('addProduct.imageGuidelines')}
          </p>
        </div>
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
    <span className="text-xs" style={{ color: styles.textMuted }}>{label}</span>
    <span className="text-xs font-medium" style={{ color: styles.textSecondary }}>{value}</span>
  </div>
);

export default AddProductPanel;
