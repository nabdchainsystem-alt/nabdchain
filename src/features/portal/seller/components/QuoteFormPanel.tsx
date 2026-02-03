// =============================================================================
// Quote Form Panel - Stage 3 Quote Creation
// Reusable component for creating/editing quotes for RFQs
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  PaperPlaneTilt,
  Package,
  CurrencyDollar,
  Truck,
  Calendar,
  NoteBlank,
  Spinner,
  CheckCircle,
  WarningCircle,
  Clock,
  Tag,
  Percent,
  FloppyDisk,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { quoteService } from '../../services/quoteService';
import {
  SellerInboxRFQ,
  Quote,
  QuoteFormState,
  QuoteFormErrors,
  CreateQuoteData,
  UpdateQuoteData,
  calculateQuoteTotalPrice,
  calculateDiscountAmount,
  isQuoteEditable,
  canSendQuote,
} from '../../types/item.types';

// =============================================================================
// Types
// =============================================================================

interface QuoteFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (quote: Quote) => void;

  // Context data
  rfq: SellerInboxRFQ;             // The RFQ to quote
  existingQuote?: Quote | null;    // For editing existing quote

  // Pre-filled values from RFQ
  defaultQuantity?: number;
}

// =============================================================================
// Constants
// =============================================================================

const CURRENCY_OPTIONS = [
  { value: 'SAR', label: 'SAR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

const DELIVERY_TERMS_OPTIONS = [
  { value: '', label: 'Select terms...' },
  { value: 'EXW', label: 'EXW - Ex Works' },
  { value: 'FOB', label: 'FOB - Free on Board' },
  { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
  { value: 'DAP', label: 'DAP - Delivered at Place' },
];

const getInitialFormState = (rfq: SellerInboxRFQ, existingQuote?: Quote | null): QuoteFormState => ({
  unitPrice: existingQuote?.unitPrice ?? rfq.item?.price ?? 0,
  quantity: existingQuote?.quantity ?? rfq.quantity ?? 1,
  currency: existingQuote?.currency ?? 'SAR',
  discount: existingQuote?.discount ?? 0,
  discountPercent: existingQuote?.discountPercent ?? 0,
  deliveryDays: existingQuote?.deliveryDays ?? rfq.item?.leadTimeDays ?? 7,
  deliveryTerms: existingQuote?.deliveryTerms ?? '',
  validUntil: existingQuote?.validUntil
    ? new Date(existingQuote.validUntil).toISOString().split('T')[0]
    : getDefaultValidUntil(),
  notes: existingQuote?.notes ?? '',
  internalNotes: existingQuote?.internalNotes ?? '',
});

// Default validity: 14 days from now
function getDefaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
}

// =============================================================================
// Component
// =============================================================================

export const QuoteFormPanel: React.FC<QuoteFormPanelProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rfq,
  existingQuote,
  defaultQuantity,
}) => {
  const { styles, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  // Form state
  const [formData, setFormData] = useState<QuoteFormState>(() =>
    getInitialFormState(rfq, existingQuote)
  );
  const [errors, setErrors] = useState<QuoteFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');

  // Calculated values
  const subtotal = formData.unitPrice * formData.quantity;
  const totalPrice = calculateQuoteTotalPrice(
    formData.unitPrice,
    formData.quantity,
    formData.discount
  );

  // Reset form when panel opens or RFQ changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(rfq, existingQuote));
      setErrors({});
      setSubmitStatus('idle');
      setSubmitMessage('');
    }
  }, [isOpen, rfq, existingQuote]);

  // Handle input changes
  const handleChange = useCallback(
    (field: keyof QuoteFormState, value: string | number) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value };

        // Sync discount amount and percentage
        if (field === 'discount' && typeof value === 'number') {
          const percent =
            subtotal > 0 ? ((value / subtotal) * 100).toFixed(2) : 0;
          newData.discountPercent = parseFloat(percent as string) || 0;
        } else if (field === 'discountPercent' && typeof value === 'number') {
          newData.discount = calculateDiscountAmount(
            formData.unitPrice,
            formData.quantity,
            value
          );
        } else if (field === 'unitPrice' || field === 'quantity') {
          // Recalculate discount amount if percentage is set
          if (discountMode === 'percent' && prev.discountPercent > 0) {
            const newSubtotal =
              (field === 'unitPrice' ? (value as number) : prev.unitPrice) *
              (field === 'quantity' ? (value as number) : prev.quantity);
            newData.discount = (newSubtotal * prev.discountPercent) / 100;
          }
        }

        return newData;
      });
      // Clear error when user starts typing
      if (errors[field as keyof QuoteFormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors, subtotal, formData.unitPrice, formData.quantity, discountMode]
  );

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: QuoteFormErrors = {};

    // Unit price validation
    if (!formData.unitPrice || formData.unitPrice <= 0) {
      newErrors.unitPrice = 'Unit price must be greater than 0';
    }

    // Quantity validation
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    // Delivery days validation
    if (formData.deliveryDays < 0) {
      newErrors.deliveryDays = 'Delivery days cannot be negative';
    }

    // Valid until validation
    if (!formData.validUntil) {
      newErrors.validUntil = 'Please set a validity date';
    } else {
      const validDate = new Date(formData.validUntil);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (validDate < tomorrow) {
        newErrors.validUntil = 'Validity date must be at least 1 day in the future';
      }
    }

    // Notes validation
    if (formData.notes && formData.notes.length > 2000) {
      newErrors.notes = 'Notes are too long (max 2000 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit form (save draft)
  const handleSaveDraft = async () => {
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

      let quote: Quote;

      if (existingQuote) {
        // Update existing quote
        const updateData: UpdateQuoteData = {
          unitPrice: formData.unitPrice,
          quantity: formData.quantity,
          currency: formData.currency,
          discount: formData.discount || undefined,
          discountPercent: formData.discountPercent || undefined,
          deliveryDays: formData.deliveryDays,
          deliveryTerms: formData.deliveryTerms || undefined,
          validUntil: new Date(formData.validUntil).toISOString(),
          notes: formData.notes || undefined,
          internalNotes: formData.internalNotes || undefined,
          changeReason: 'Updated quote',
        };

        const result = await quoteService.updateQuote(token, existingQuote.id, updateData);
        if (!result) {
          throw new Error('Quote not found');
        }
        quote = result;
      } else {
        // Create new draft
        const createData: CreateQuoteData = {
          rfqId: rfq.id,
          unitPrice: formData.unitPrice,
          quantity: formData.quantity,
          currency: formData.currency,
          discount: formData.discount || undefined,
          discountPercent: formData.discountPercent || undefined,
          deliveryDays: formData.deliveryDays,
          deliveryTerms: formData.deliveryTerms || undefined,
          validUntil: new Date(formData.validUntil).toISOString(),
          notes: formData.notes || undefined,
          internalNotes: formData.internalNotes || undefined,
        };

        quote = await quoteService.createDraft(token, createData);
      }

      setSubmitStatus('success');
      setSubmitMessage('Quote saved as draft');

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.(quote);
      }, 1000);
    } catch (error) {
      console.error('Failed to save quote:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Failed to save quote. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send quote to buyer
  const handleSendQuote = async () => {
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

      let quote: Quote;

      // First save/update the quote
      if (existingQuote) {
        const updateData: UpdateQuoteData = {
          unitPrice: formData.unitPrice,
          quantity: formData.quantity,
          currency: formData.currency,
          discount: formData.discount || undefined,
          discountPercent: formData.discountPercent || undefined,
          deliveryDays: formData.deliveryDays,
          deliveryTerms: formData.deliveryTerms || undefined,
          validUntil: new Date(formData.validUntil).toISOString(),
          notes: formData.notes || undefined,
          internalNotes: formData.internalNotes || undefined,
        };

        const updated = await quoteService.updateQuote(token, existingQuote.id, updateData);
        if (!updated) {
          throw new Error('Quote not found');
        }
        quote = updated;
      } else {
        const createData: CreateQuoteData = {
          rfqId: rfq.id,
          unitPrice: formData.unitPrice,
          quantity: formData.quantity,
          currency: formData.currency,
          discount: formData.discount || undefined,
          discountPercent: formData.discountPercent || undefined,
          deliveryDays: formData.deliveryDays,
          deliveryTerms: formData.deliveryTerms || undefined,
          validUntil: new Date(formData.validUntil).toISOString(),
          notes: formData.notes || undefined,
          internalNotes: formData.internalNotes || undefined,
        };

        quote = await quoteService.createDraft(token, createData);
      }

      // Now send the quote
      const sentQuote = await quoteService.sendQuote(token, quote.id);
      if (!sentQuote) {
        throw new Error('Failed to send quote');
      }

      setSubmitStatus('success');
      setSubmitMessage(
        `Quote ${sentQuote.quoteNumber || sentQuote.id.slice(0, 8).toUpperCase()} sent to buyer!`
      );

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.(sentQuote);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to send quote:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Failed to send quote. Please try again.'
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

  // Check if quote can be sent
  const sendValidation = existingQuote
    ? canSendQuote({ status: existingQuote.status, validUntil: formData.validUntil })
    : { canSend: true };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        className={`
          fixed z-50 top-0 ${isRtl ? 'left-0' : 'right-0'} h-full w-full max-w-lg
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : isRtl ? '-translate-x-full' : 'translate-x-full'}
        `}
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: styles.borderLight }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${styles.success}15` }}>
              <CurrencyDollar size={20} weight="fill" style={{ color: styles.success }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                {existingQuote ? 'Edit Quote' : 'Create Quote'}
              </h2>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                RFQ: {rfq.rfqNumber || rfq.id.slice(0, 8).toUpperCase()}
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
        <div className="overflow-y-auto h-[calc(100%-180px)] px-6 py-4">
          <form className="space-y-5">
            {/* Item Preview */}
            {rfq.item && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: styles.bgSecondary }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: styles.bgCard }}
                >
                  <Package size={20} style={{ color: styles.textMuted }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: styles.textPrimary }}>
                    {rfq.item.name}
                  </p>
                  <p className="text-xs" style={{ color: styles.textMuted }}>
                    SKU: {rfq.item.sku} | Requested: {rfq.quantity} units
                  </p>
                </div>
              </div>
            )}

            {/* Unit Price & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: styles.textPrimary }}
                >
                  Unit Price <span style={{ color: styles.error }}>*</span>
                </label>
                <div className="relative">
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
                    onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: styles.bgSecondary,
                      borderColor: errors.unitPrice ? styles.error : styles.borderLight,
                      color: styles.textPrimary,
                    }}
                    placeholder="0.00"
                  />
                </div>
                {errors.unitPrice && (
                  <p className="text-xs mt-1" style={{ color: styles.error }}>
                    {errors.unitPrice}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: styles.textPrimary }}
                >
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
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
                  className="flex-1 px-4 py-2.5 rounded-lg border text-center transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: errors.quantity ? styles.error : styles.borderLight,
                    color: styles.textPrimary,
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
              {errors.quantity && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Discount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                  Discount
                </label>
                <div
                  className="flex rounded-lg overflow-hidden border"
                  style={{ borderColor: styles.borderLight }}
                >
                  <button
                    type="button"
                    onClick={() => setDiscountMode('amount')}
                    className="px-2 py-1 text-xs transition-colors"
                    style={{
                      backgroundColor:
                        discountMode === 'amount' ? styles.info : styles.bgSecondary,
                      color: discountMode === 'amount' ? '#fff' : styles.textMuted,
                    }}
                  >
                    <Tag size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountMode('percent')}
                    className="px-2 py-1 text-xs transition-colors"
                    style={{
                      backgroundColor:
                        discountMode === 'percent' ? styles.info : styles.bgSecondary,
                      color: discountMode === 'percent' ? '#fff' : styles.textMuted,
                    }}
                  >
                    <Percent size={14} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: styles.textMuted }}
                >
                  {discountMode === 'amount' ? <Tag size={18} /> : <Percent size={18} />}
                </div>
                <input
                  type="number"
                  step={discountMode === 'percent' ? '0.01' : '1'}
                  min="0"
                  max={discountMode === 'percent' ? '100' : subtotal}
                  value={
                    discountMode === 'amount'
                      ? formData.discount || ''
                      : formData.discountPercent || ''
                  }
                  onChange={(e) =>
                    handleChange(
                      discountMode === 'amount' ? 'discount' : 'discountPercent',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: styles.borderLight,
                    color: styles.textPrimary,
                  }}
                  placeholder={discountMode === 'amount' ? '0.00' : '0%'}
                />
              </div>
            </div>

            {/* Price Summary */}
            <div
              className="p-3 rounded-lg space-y-2"
              style={{ backgroundColor: styles.bgSecondary }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: styles.textMuted }}>Subtotal</span>
                <span style={{ color: styles.textPrimary }}>
                  {formData.currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: styles.textMuted }}>Discount</span>
                  <span style={{ color: styles.error }}>
                    -{formData.currency} {formData.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: styles.borderLight }}>
                <span style={{ color: styles.textPrimary }}>Total</span>
                <span style={{ color: styles.success }}>
                  {formData.currency} {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Delivery Days */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
                Lead Time (Days) <span style={{ color: styles.error }}>*</span>
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
                  min="0"
                  value={formData.deliveryDays}
                  onChange={(e) => handleChange('deliveryDays', parseInt(e.target.value) || 0)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: errors.deliveryDays ? styles.error : styles.borderLight,
                    color: styles.textPrimary,
                  }}
                  placeholder="7"
                />
              </div>
              {errors.deliveryDays && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.deliveryDays}
                </p>
              )}
            </div>

            {/* Delivery Terms */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
                Delivery Terms (Incoterms)
              </label>
              <select
                value={formData.deliveryTerms}
                onChange={(e) => handleChange('deliveryTerms', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border transition-colors"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: styles.borderLight,
                  color: styles.textPrimary,
                }}
              >
                {DELIVERY_TERMS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Valid Until */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
                Quote Valid Until <span style={{ color: styles.error }}>*</span>
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: styles.textMuted }}
                >
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  min={getMinDate()}
                  value={formData.validUntil}
                  onChange={(e) => handleChange('validUntil', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: errors.validUntil ? styles.error : styles.borderLight,
                    color: styles.textPrimary,
                  }}
                />
              </div>
              {errors.validUntil && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.validUntil}
                </p>
              )}
            </div>

            {/* Notes (Terms & Conditions) */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
                Terms & Conditions
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
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors resize-none"
                  style={{
                    backgroundColor: styles.bgSecondary,
                    borderColor: errors.notes ? styles.error : styles.borderLight,
                    color: styles.textPrimary,
                  }}
                  placeholder="Payment terms, warranty, conditions..."
                />
              </div>
              {errors.notes && (
                <p className="text-xs mt-1" style={{ color: styles.error }}>
                  {errors.notes}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                Visible to the buyer
              </p>
            </div>

            {/* Internal Notes (Seller Only) */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => handleChange('internalNotes', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border transition-colors resize-none"
                style={{
                  backgroundColor: styles.bgSecondary,
                  borderColor: styles.borderLight,
                  color: styles.textPrimary,
                }}
                placeholder="Notes for your reference only..."
              />
              <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                Not visible to the buyer
              </p>
            </div>

            {/* Submit Status */}
            {submitStatus !== 'idle' && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  submitStatus === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {submitStatus === 'success' ? (
                  <CheckCircle
                    size={20}
                    weight="fill"
                    className="text-green-600 flex-shrink-0"
                  />
                ) : (
                  <WarningCircle
                    size={20}
                    weight="fill"
                    className="text-red-600 flex-shrink-0"
                  />
                )}
                <p
                  className={`text-sm ${
                    submitStatus === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {submitMessage}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div
          className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t"
          style={{
            borderColor: styles.borderLight,
            backgroundColor: styles.bgPrimary,
          }}
        >
          <div className="flex gap-3">
            {/* Save Draft Button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textPrimary,
                border: `1px solid ${styles.borderLight}`,
              }}
            >
              {isSubmitting ? (
                <Spinner size={20} className="animate-spin" />
              ) : (
                <FloppyDisk size={20} />
              )}
              Save Draft
            </button>

            {/* Send Quote Button */}
            <button
              type="button"
              onClick={handleSendQuote}
              disabled={isSubmitting || !sendValidation.canSend}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: sendValidation.canSend ? styles.success : styles.bgSecondary,
                color: sendValidation.canSend ? '#fff' : styles.textMuted,
              }}
              title={sendValidation.reason}
            >
              {isSubmitting ? (
                <Spinner size={20} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={20} weight="fill" />
              )}
              Send Quote
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuoteFormPanel;
