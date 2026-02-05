// =============================================================================
// Submit Marketplace Quote Modal
// =============================================================================
// Modal for sellers to submit quotes on open buyer RFQs from the marketplace

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  PaperPlaneTilt,
  CurrencyDollar,
  Package,
  Truck,
  Calendar,
  NoteBlank,
  Spinner,
  CheckCircle,
  WarningCircle,
  FloppyDisk,
  Info,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { PortalDatePicker } from '../../components';
import { rfqMarketplaceService } from '../../services/rfqMarketplaceService';
import {
  MarketplaceRFQ,
  MarketplaceQuoteSubmission,
  formatQuantity,
} from '../../types/rfq-marketplace.types';

// =============================================================================
// Types
// =============================================================================

interface SubmitMarketplaceQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfq: MarketplaceRFQ;
  onSuccess?: () => void;
}

interface FormState {
  unitPrice: number;
  quantity: number;
  currency: string;
  leadTimeDays: number;
  validityDays: number;
  notes: string;
}

interface FormErrors {
  unitPrice?: string;
  quantity?: string;
  leadTimeDays?: string;
  validityDays?: string;
}

// =============================================================================
// Constants
// =============================================================================

const CURRENCY_OPTIONS = [
  { value: 'SAR', label: 'SAR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

const VALIDITY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
];

// =============================================================================
// Component
// =============================================================================

export const SubmitMarketplaceQuoteModal: React.FC<SubmitMarketplaceQuoteModalProps> = ({
  isOpen,
  onClose,
  rfq,
  onSuccess,
}) => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Form state
  const [formData, setFormData] = useState<FormState>({
    unitPrice: 0,
    quantity: rfq.quantity,
    currency: rfq.targetCurrency || 'SAR',
    leadTimeDays: rfq.leadTimeRequired || 7,
    validityDays: 14,
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  // Calculated values
  const totalPrice = formData.unitPrice * formData.quantity;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        unitPrice: 0,
        quantity: rfq.quantity,
        currency: rfq.targetCurrency || 'SAR',
        leadTimeDays: rfq.leadTimeRequired || 7,
        validityDays: 14,
        notes: '',
      });
      setErrors({});
      setSubmitStatus('idle');
      setSubmitMessage('');
    }
  }, [isOpen, rfq]);

  // Handle input changes
  const handleChange = useCallback((field: keyof FormState, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      newErrors.unitPrice = t('seller.rfqMarketplace.errorUnitPrice') || 'Unit price must be greater than 0';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = t('seller.rfqMarketplace.errorQuantity') || 'Quantity must be greater than 0';
    }

    if (!formData.leadTimeDays || formData.leadTimeDays <= 0) {
      newErrors.leadTimeDays = t('seller.rfqMarketplace.errorLeadTime') || 'Lead time must be greater than 0';
    }

    if (!formData.validityDays || formData.validityDays <= 0) {
      newErrors.validityDays = t('seller.rfqMarketplace.errorValidity') || 'Validity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Submit quote
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const submissionData: MarketplaceQuoteSubmission = {
        rfqId: rfq.id,
        unitPrice: formData.unitPrice,
        quantity: formData.quantity,
        currency: formData.currency,
        leadTimeDays: formData.leadTimeDays,
        validityDays: formData.validityDays,
        notes: formData.notes || undefined,
      };

      await rfqMarketplaceService.submitQuote(token, submissionData);

      setSubmitStatus('success');
      setSubmitMessage(t('seller.rfqMarketplace.quoteSubmittedSuccess') || 'Quote submitted successfully!');

      // Close after brief feedback
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to submit quote:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : t('seller.rfqMarketplace.quoteSubmitError') || 'Failed to submit quote. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation states
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
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-200"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 inset-0 flex items-center justify-center p-4"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: styles.bgPrimary,
            transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
            opacity: isAnimating ? 1 : 0,
          }}
          dir={direction}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: `1px solid ${styles.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${styles.success}15` }}
              >
                <PaperPlaneTilt size={20} weight="fill" style={{ color: styles.success }} />
              </div>
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: styles.textPrimary, fontFamily: styles.fontHeading }}
                >
                  {t('seller.rfqMarketplace.submitQuoteTitle') || 'Submit Quote'}
                </h2>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  {rfq.rfqNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: styles.textMuted }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* RFQ Summary */}
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.borderLight}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: styles.bgCard }}
                >
                  <Package size={18} style={{ color: styles.textMuted }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                    {rfq.partName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: styles.textMuted }}>
                    <span>{rfq.buyer.companyName}</span>
                    <span>•</span>
                    <span>{formatQuantity(rfq.quantity, rfq.unit)} requested</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                {t('seller.rfqMarketplace.unitPrice') || 'Unit Price'} <span style={{ color: styles.error }}>*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: styles.textMuted }}
                  >
                    <CurrencyDollar size={18} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice || ''}
                    onChange={e => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: styles.bgSecondary,
                      borderColor: errors.unitPrice ? styles.error : styles.borderLight,
                      color: styles.textPrimary,
                    }}
                    placeholder="0.00"
                  />
                </div>
                <select
                  value={formData.currency}
                  onChange={e => handleChange('currency', e.target.value)}
                  className="px-3 py-2.5 rounded-lg border"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                >
                  {CURRENCY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.unitPrice && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.unitPrice}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                {t('seller.rfqMarketplace.quantity') || 'Quantity'} <span style={{ color: styles.error }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={e => handleChange('quantity', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: errors.quantity ? styles.error : styles.borderLight,
                  color: styles.textPrimary,
                }}
              />
              {errors.quantity && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Total Price Display */}
            {formData.unitPrice > 0 && (
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${styles.success}10` }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: styles.textSecondary }}>
                    {t('seller.rfqMarketplace.totalPrice') || 'Total Price'}
                  </span>
                  <span className="text-lg font-semibold" style={{ color: styles.success }}>
                    {formData.currency} {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Lead Time */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                {t('seller.rfqMarketplace.leadTime') || 'Lead Time (Days)'} <span style={{ color: styles.error }}>*</span>
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: styles.textMuted }}
                >
                  <Truck size={18} />
                </div>
                <input
                  type="number"
                  min="1"
                  value={formData.leadTimeDays}
                  onChange={e => handleChange('leadTimeDays', parseInt(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: errors.leadTimeDays ? styles.error : styles.borderLight,
                    color: styles.textPrimary,
                  }}
                />
              </div>
              {errors.leadTimeDays && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.leadTimeDays}
                </p>
              )}
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                {t('seller.rfqMarketplace.validityPeriod') || 'Quote Validity'} <span style={{ color: styles.error }}>*</span>
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: styles.textMuted }}
                >
                  <Calendar size={18} />
                </div>
                <select
                  value={formData.validityDays}
                  onChange={e => handleChange('validityDays', parseInt(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors appearance-none"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                >
                  {VALIDITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
                {t('seller.rfqMarketplace.notesToBuyer') || 'Notes to Buyer'}
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-3"
                  style={{ color: styles.textMuted }}
                >
                  <NoteBlank size={18} />
                </div>
                <textarea
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors resize-none"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                  placeholder={t('seller.rfqMarketplace.notesPlaceholder') || 'Payment terms, warranty, special conditions...'}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                {t('seller.rfqMarketplace.notesHint') || 'This will be visible to the buyer'}
              </p>
            </div>

            {/* Info Notice */}
            <div
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ backgroundColor: `${styles.info}10` }}
            >
              <Info size={16} style={{ color: styles.info, flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs" style={{ color: styles.textSecondary }}>
                {t('seller.rfqMarketplace.submitNotice') ||
                  'Once submitted, your quote will be sent to the buyer immediately. You can revise your quote from the RFQ Inbox.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4"
            style={{ borderTop: `1px solid ${styles.border}` }}
          >
            {/* Status Message */}
            {submitStatus !== 'idle' && (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 ${
                  submitStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                }`}
              >
                {submitStatus === 'success' ? (
                  <CheckCircle size={16} weight="fill" className="text-green-600 dark:text-green-400" />
                ) : (
                  <WarningCircle size={16} weight="fill" className="text-red-600 dark:text-red-400" />
                )}
                <p
                  className={`text-sm ${
                    submitStatus === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {submitMessage}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-medium transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  color: styles.textPrimary,
                  border: `1px solid ${styles.border}`,
                }}
              >
                {t('seller.rfqMarketplace.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || formData.unitPrice <= 0}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: formData.unitPrice > 0 ? styles.success : styles.bgSecondary,
                  color: formData.unitPrice > 0 ? '#fff' : styles.textMuted,
                }}
              >
                {isSubmitting ? (
                  <Spinner size={18} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={18} weight="fill" />
                )}
                {t('seller.rfqMarketplace.submitQuote') || 'Submit Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmitMarketplaceQuoteModal;
