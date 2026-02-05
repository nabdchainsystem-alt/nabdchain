// =============================================================================
// RFQ Form Panel - Stage 1 RFQ Creation
// Reusable component for creating RFQs from multiple entry points
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  PaperPlaneTilt,
  Package,
  MapPin,
  Calendar,
  ChatText,
  Lightning,
  Spinner,
  CheckCircle,
  WarningCircle,
  Clock,
  Storefront,
  CaretDown,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { PortalDatePicker } from '../../components';
import { itemService } from '../../services/itemService';
import {
  Item,
  ItemRFQ,
  RFQSource,
  RFQPriority,
  RFQFormState,
  RFQFormErrors,
  CreateRFQData,
} from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface RFQFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rfq: ItemRFQ) => void;

  // Context data
  item?: Item | null;           // For item-level RFQs
  sellerId: string;             // Required
  sellerName?: string;          // For display
  source: RFQSource;            // 'item' | 'profile' | 'listing'

  // Pre-filled values
  defaultQuantity?: number;
}

// =============================================================================
// Constants
// =============================================================================

const PRIORITY_OPTIONS: { value: RFQPriority; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Standard processing time' },
  { value: 'urgent', label: 'Urgent', description: 'Faster response needed' },
  { value: 'critical', label: 'Critical', description: 'Immediate attention required' },
];

const INITIAL_FORM_STATE: RFQFormState = {
  quantity: 1,
  deliveryLocation: '',
  deliveryCity: '',
  deliveryCountry: 'SA',
  requiredDeliveryDate: '',
  message: '',
  priority: 'normal',
};

// =============================================================================
// Component
// =============================================================================

export const RFQFormPanel: React.FC<RFQFormPanelProps> = ({
  isOpen,
  onClose,
  onSuccess,
  item,
  sellerId,
  sellerName,
  source,
  defaultQuantity,
}) => {
  const { styles, direction, t } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Form state
  const [formData, setFormData] = useState<RFQFormState>({
    ...INITIAL_FORM_STATE,
    quantity: defaultQuantity || item?.minOrderQty || 1,
  });
  const [errors, setErrors] = useState<RFQFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showPriorityOptions, setShowPriorityOptions] = useState(false);

  // Reset form when panel opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...INITIAL_FORM_STATE,
        quantity: defaultQuantity || item?.minOrderQty || 1,
      });
      setErrors({});
      setSubmitStatus('idle');
      setSubmitMessage('');
    }
  }, [isOpen, defaultQuantity, item?.minOrderQty]);

  // Handle input changes
  const handleChange = useCallback((field: keyof RFQFormState, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof RFQFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: RFQFormErrors = {};

    // Quantity validation
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    // Delivery location validation
    if (!formData.deliveryLocation || formData.deliveryLocation.trim().length < 3) {
      newErrors.deliveryLocation = 'Please enter a valid delivery location';
    }
    if (formData.deliveryLocation && formData.deliveryLocation.length > 500) {
      newErrors.deliveryLocation = 'Delivery location is too long';
    }

    // Delivery date validation (if provided)
    if (formData.requiredDeliveryDate) {
      const date = new Date(formData.requiredDeliveryDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (date < tomorrow) {
        newErrors.requiredDeliveryDate = 'Delivery date must be at least 1 day in the future';
      }
    }

    // Message validation
    if (formData.message && formData.message.length > 2000) {
      newErrors.message = 'Message is too long (max 2000 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const rfqData: CreateRFQData = {
        itemId: item?.id || null,
        sellerId,
        quantity: formData.quantity,
        deliveryLocation: formData.deliveryLocation.trim(),
        deliveryCity: formData.deliveryCity.trim() || undefined,
        deliveryCountry: formData.deliveryCountry || 'SA',
        requiredDeliveryDate: formData.requiredDeliveryDate || undefined,
        message: formData.message.trim() || undefined,
        priority: formData.priority,
        source,
      };

      const rfq = await itemService.createRFQ(token, rfqData);

      setSubmitStatus('success');
      setSubmitMessage(`RFQ sent successfully! Reference: ${rfq.id.slice(0, 8).toUpperCase()}`);

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.(rfq);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Failed to create RFQ:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Failed to send RFQ. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date for date picker (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Animation states for smooth enter/exit
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - transparent, just for click-outside */}
      <div
        className="fixed inset-0 z-40"
        style={{ top: '64px' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed z-50 w-full max-w-md overflow-hidden flex flex-col"
        dir={direction}
        style={{
          top: '64px',
          bottom: 0,
          backgroundColor: styles.bgPrimary,
          borderLeft: isRtl ? 'none' : `1px solid ${styles.border}`,
          borderRight: isRtl ? `1px solid ${styles.border}` : 'none',
          boxShadow: styles.isDark
            ? '-12px 0 40px rgba(0, 0, 0, 0.6)'
            : '-8px 0 30px rgba(0, 0, 0, 0.1)',
          right: isRtl ? 'auto' : 0,
          left: isRtl ? 0 : 'auto',
          transform: isAnimating
            ? 'translateX(0)'
            : isRtl
            ? 'translateX(-100%)'
            : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: styles.borderLight }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${styles.info}15` }}
            >
              <PaperPlaneTilt size={20} weight="fill" style={{ color: styles.info }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                Request Quote
              </h2>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {source === 'profile' ? `To ${sellerName || 'Seller'}` :
                 item ? `For ${item.name}` : 'General inquiry'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: styles.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Item Preview (if item-level RFQ) */}
            {item && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: styles.bgCard }}
                  >
                    <Package size={20} style={{ color: styles.textMuted }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    SKU: {item.sku}
                  </p>
                </div>
              </div>
            )}

            {/* Seller Info (for profile-level RFQ) */}
            {source === 'profile' && sellerName && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: styles.bgCard }}
                >
                  <Storefront size={20} style={{ color: styles.info }} />
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                    {sellerName}
                  </p>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    General inquiry (no specific item)
                  </p>
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                Quantity <span style={{ color: styles.error }}>*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('quantity', Math.max(1, formData.quantity - 1))}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                  className="flex-1 px-4 py-2 rounded-lg text-center text-lg font-medium"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    border: errors.quantity ? `1px solid ${styles.error}` : `1px solid ${styles.borderLight}`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleChange('quantity', formData.quantity + 1)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                  }}
                >
                  +
                </button>
              </div>
              {item?.minOrderQty && item.minOrderQty > 1 && (
                <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                  Minimum order: {item.minOrderQty} units
                </p>
              )}
              {errors.quantity && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Delivery Location */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                <MapPin size={14} className="inline mr-1" />
                Delivery Location <span style={{ color: styles.error }}>*</span>
              </label>
              <textarea
                value={formData.deliveryLocation}
                onChange={(e) => handleChange('deliveryLocation', e.target.value)}
                placeholder="Enter city, region, or full delivery address"
                rows={2}
                className="w-full px-4 py-3 rounded-lg resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: styles.textPrimary,
                  border: errors.deliveryLocation ? `1px solid ${styles.error}` : `1px solid ${styles.borderLight}`,
                }}
              />
              {errors.deliveryLocation && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.deliveryLocation}
                </p>
              )}
            </div>

            {/* Required Delivery Date (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                <Calendar size={14} className="inline mr-1" />
                Required Delivery Date
                <span className="text-xs font-normal ml-1" style={{ color: styles.textMuted }}>
                  (Optional)
                </span>
              </label>
              <PortalDatePicker
                value={formData.requiredDeliveryDate}
                onChange={(value) => handleChange('requiredDeliveryDate', value)}
                minDate={getMinDate()}
                className="w-full"
              />
              {errors.requiredDeliveryDate && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.requiredDeliveryDate}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                <Lightning size={14} className="inline mr-1" />
                Priority
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPriorityOptions(!showPriorityOptions)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    color: styles.textPrimary,
                    border: `1px solid ${styles.borderLight}`,
                  }}
                >
                  <span className="flex items-center gap-2">
                    {formData.priority === 'urgent' && (
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    )}
                    {formData.priority === 'critical' && (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}
                  </span>
                  <CaretDown
                    size={16}
                    style={{ color: styles.textMuted }}
                    className={`transition-transform ${showPriorityOptions ? 'rotate-180' : ''}`}
                  />
                </button>

                {showPriorityOptions && (
                  <div
                    className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                    style={{
                      backgroundColor: styles.bgCard,
                      border: `1px solid ${styles.borderLight}`,
                    }}
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          handleChange('priority', option.value);
                          setShowPriorityOptions(false);
                        }}
                        className="w-full px-4 py-3 text-left transition-colors flex items-center justify-between"
                        style={{
                          backgroundColor: formData.priority === option.value ? styles.bgSecondary : 'transparent',
                          color: styles.textPrimary,
                        }}
                        onMouseEnter={(e) => {
                          if (formData.priority !== option.value) {
                            e.currentTarget.style.backgroundColor = styles.bgHover;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            formData.priority === option.value ? styles.bgSecondary : 'transparent';
                        }}
                      >
                        <div>
                          <span className="flex items-center gap-2">
                            {option.value === 'urgent' && (
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            )}
                            {option.value === 'critical' && (
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                            {option.label}
                          </span>
                          <p className="text-xs mt-0.5" style={{ color: styles.textMuted }}>
                            {option.description}
                          </p>
                        </div>
                        {formData.priority === option.value && (
                          <CheckCircle size={16} weight="fill" style={{ color: styles.info }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Message (Optional) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                <ChatText size={14} className="inline mr-1" />
                Additional Notes
                <span className="text-xs font-normal ml-1" style={{ color: styles.textMuted }}>
                  (Optional)
                </span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Add any special requirements, specifications, or questions..."
                rows={3}
                maxLength={2000}
                className="w-full px-4 py-3 rounded-lg resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: styles.textPrimary,
                  border: errors.message ? `1px solid ${styles.error}` : `1px solid ${styles.borderLight}`,
                }}
              />
              <div className="flex justify-between mt-1">
                {errors.message ? (
                  <p className="text-xs" style={{ color: styles.error }}>
                    {errors.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs" style={{ color: styles.textMuted }}>
                  {formData.message.length}/2000
                </span>
              </div>
            </div>

            {/* Typical Response Time Hint */}
            {item?.avgResponseTime && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{ backgroundColor: `${styles.info}10` }}
              >
                <Clock size={16} style={{ color: styles.info }} />
                <p className="text-xs" style={{ color: styles.textSecondary }}>
                  This seller typically responds within{' '}
                  <strong>{item.avgResponseTime < 24 ? `${item.avgResponseTime} hours` : `${Math.round(item.avgResponseTime / 24)} days`}</strong>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 border-t"
          style={{
            backgroundColor: styles.bgPrimary,
            borderColor: styles.borderLight,
          }}
        >
          {/* Status Message */}
          {submitStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 mb-3 p-3 rounded-lg ${
                submitStatus === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}
            >
              {submitStatus === 'success' ? (
                <CheckCircle size={18} weight="fill" className="text-green-500" />
              ) : (
                <WarningCircle size={18} weight="fill" className="text-red-500" />
              )}
              <p
                className="text-sm"
                style={{ color: submitStatus === 'success' ? '#22c55e' : styles.error }}
              >
                {submitMessage}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textPrimary,
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || submitStatus === 'success'}
              className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: styles.info,
                color: '#fff',
                opacity: isSubmitting || submitStatus === 'success' ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner size={18} className="animate-spin" />
                  Sending...
                </>
              ) : submitStatus === 'success' ? (
                <>
                  <CheckCircle size={18} weight="fill" />
                  Sent!
                </>
              ) : (
                <>
                  <PaperPlaneTilt size={18} weight="fill" />
                  Send RFQ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RFQFormPanel;
