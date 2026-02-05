// =============================================================================
// Quote Form Panel - Stage 3 Quote Creation
// Reusable component for creating/editing quotes for RFQs
// Amazon Business RFQ-style UX: fast, calm, frictionless
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Info,
  Lightning,
  Timer,
  Paperclip,
  File,
  FilePdf,
  FileDoc,
  FileImage,
  Trash,
  UploadSimple,
  DownloadSimple,
} from 'phosphor-react';
import { useAuth } from '../../../../auth-adapter';
import { usePortal } from '../../context/PortalContext';
import { PortalDatePicker } from '../../components';
import { quoteService } from '../../services/quoteService';
import {
  SellerInboxRFQ,
  Quote,
  QuoteFormState,
  QuoteFormErrors,
  CreateQuoteData,
  UpdateQuoteData,
  QuoteAttachment,
  QuoteAttachmentType,
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

  // Attachment state
  const [attachments, setAttachments] = useState<QuoteAttachment[]>(
    existingQuote?.attachments || []
  );
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAttachments(existingQuote?.attachments || []);
      setPendingAttachments([]);
    }
  }, [isOpen, rfq, existingQuote]);

  // Allowed file types for attachments
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Determine attachment type from file
  const getAttachmentType = (file: File): QuoteAttachmentType => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (file.type === 'application/pdf' || ext === 'pdf') return 'spec_sheet';
    if (file.type.startsWith('image/')) return 'certificate';
    if (file.type.includes('word') || ext === 'doc' || ext === 'docx') return 'terms';
    return 'other';
  };

  // Get file icon based on type
  const getFileIcon = (file: File | QuoteAttachment) => {
    const mimeType = 'type' in file && typeof file.type === 'string' && file.type.includes('/')
      ? file.type
      : (file as QuoteAttachment).mimeType || '';
    const name = 'name' in file ? file.name : '';

    if (mimeType === 'application/pdf' || name.endsWith('.pdf')) {
      return <FilePdf size={18} style={{ color: '#ef4444' }} />;
    }
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
      return <FileImage size={18} style={{ color: '#3b82f6' }} />;
    }
    if (mimeType.includes('word') || /\.(doc|docx)$/i.test(name)) {
      return <FileDoc size={18} style={{ color: '#2563eb' }} />;
    }
    return <File size={18} style={{ color: styles.textMuted }} />;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errorMessages: string[] = [];

    files.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errorMessages.push(`${file.name}: Unsupported file type`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errorMessages.push(`${file.name}: File too large (max 10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (errorMessages.length > 0) {
      setSubmitStatus('error');
      setSubmitMessage(errorMessages.join('. '));
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }

    if (validFiles.length > 0) {
      setPendingAttachments((prev) => [...prev, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove pending attachment
  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove uploaded attachment
  const removeUploadedAttachment = async (attachmentId: string) => {
    if (!existingQuote) return;

    try {
      const token = await getToken();
      if (!token) return;

      await quoteService.removeAttachment(token, existingQuote.id, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to remove attachment');
      setTimeout(() => setSubmitStatus('idle'), 2000);
    }
  };

  // Upload pending attachments after quote is saved
  const uploadPendingAttachments = async (quoteId: string) => {
    if (pendingAttachments.length === 0) return;

    const token = await getToken();
    if (!token) return;

    for (const file of pendingAttachments) {
      try {
        const uploaded = await quoteService.addAttachment(
          token,
          quoteId,
          file,
          getAttachmentType(file)
        );
        setAttachments((prev) => [...prev, uploaded]);
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      }
    }
    setPendingAttachments([]);
  };

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

  // Validate form for sending (strict validation)
  const validateForSend = useCallback((): boolean => {
    return validateForm();
  }, [validateForm]);

  // Validate form for saving draft (minimal validation)
  const validateForDraft = useCallback((): boolean => {
    // For drafts, we only require basic data - allow incomplete quotes
    if (formData.unitPrice < 0) {
      setErrors({ unitPrice: 'Unit price cannot be negative' });
      return false;
    }
    if (formData.quantity < 0) {
      setErrors({ quantity: 'Quantity cannot be negative' });
      return false;
    }
    return true;
  }, [formData.unitPrice, formData.quantity]);

  // Submit form (save draft) - No strict validation blocking
  const handleSaveDraft = async () => {
    // Minimal validation for draft (allow incomplete)
    if (!validateForDraft()) {
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
          unitPrice: formData.unitPrice || 0,
          quantity: formData.quantity || rfq.quantity,
          currency: formData.currency,
          discount: formData.discount || undefined,
          discountPercent: formData.discountPercent || undefined,
          deliveryDays: formData.deliveryDays || 7,
          deliveryTerms: formData.deliveryTerms || undefined,
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : getDefaultValidUntil(),
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
          unitPrice: formData.unitPrice || 0,
          quantity: formData.quantity || rfq.quantity,
          currency: formData.currency,
          discount: formData.discount || undefined,
          discountPercent: formData.discountPercent || undefined,
          deliveryDays: formData.deliveryDays || 7,
          deliveryTerms: formData.deliveryTerms || undefined,
          validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : getDefaultValidUntil(),
          notes: formData.notes || undefined,
          internalNotes: formData.internalNotes || undefined,
        };

        quote = await quoteService.createDraft(token, createData);
      }

      // Upload any pending attachments
      if (pendingAttachments.length > 0) {
        await uploadPendingAttachments(quote.id);
      }

      setSubmitStatus('success');
      setSubmitMessage('Draft saved');

      // Brief feedback, then callback
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 1500);
    } catch (error) {
      console.error('Failed to save quote:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error ? error.message : 'Failed to save draft. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send quote to buyer
  const handleSendQuote = async () => {
    // Strict validation required for sending
    if (!validateForSend()) {
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

      // Upload any pending attachments before sending
      if (pendingAttachments.length > 0) {
        await uploadPendingAttachments(quote.id);
      }

      // Now send the quote
      const sentQuote = await quoteService.sendQuote(token, quote.id);
      if (!sentQuote) {
        throw new Error('Failed to send quote');
      }

      setSubmitStatus('success');
      setSubmitMessage('Quote sent · Buyer notified');

      // Call success callback after brief feedback
      setTimeout(() => {
        onSuccess?.(sentQuote);
        onClose();
      }, 1200);
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

  // Animation states for smooth enter/exit
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
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
        className="fixed z-50 w-full max-w-lg overflow-hidden flex flex-col"
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
        dir={direction}
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
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form className="space-y-5">
            {/* RFQ Summary Header - Always visible context */}
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: styles.bgSecondary, border: `1px solid ${styles.border}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: styles.bgCard }}
                  >
                    <Package size={18} style={{ color: styles.textMuted }} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                      {rfq.item?.name || 'General RFQ'}
                    </p>
                    {rfq.item?.sku && (
                      <p className="text-xs" style={{ color: styles.textMuted }}>
                        SKU: {rfq.item.sku}
                      </p>
                    )}
                  </div>
                </div>
                {/* Quick info badges */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium tabular-nums"
                    style={{ backgroundColor: styles.bgCard, color: styles.textPrimary }}
                  >
                    {rfq.quantity} units requested
                  </span>
                  {rfq.requiredDeliveryDate && (
                    <span
                      className="px-2 py-0.5 rounded text-xs flex items-center gap-1"
                      style={{ backgroundColor: styles.bgCard, color: styles.textMuted }}
                    >
                      <Timer size={10} />
                      {new Date(rfq.requiredDeliveryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {/* Buyer info */}
              <div className="flex items-center gap-2 text-xs" style={{ color: styles.textMuted }}>
                <span>From:</span>
                <span style={{ color: styles.textSecondary }}>{rfq.buyerCompanyName || 'Unknown Buyer'}</span>
              </div>
            </div>

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
              <PortalDatePicker
                value={formData.validUntil}
                onChange={(value) => handleChange('validUntil', value)}
                minDate={getMinDate()}
                className="w-full"
              />
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

            {/* Attachments Section */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: styles.textPrimary }}
              >
                <div className="flex items-center gap-2">
                  <Paperclip size={16} />
                  <span>Attachments</span>
                </div>
              </label>

              {/* Upload area */}
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: styles.borderLight,
                  backgroundColor: styles.bgSecondary,
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = styles.info;
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = styles.borderLight;
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = styles.borderLight;
                  const files = Array.from(e.dataTransfer.files);
                  const input = fileInputRef.current;
                  if (input) {
                    const dataTransfer = new DataTransfer();
                    files.forEach((f) => dataTransfer.items.add(f));
                    input.files = dataTransfer.files;
                    handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <UploadSimple size={24} style={{ color: styles.textMuted, margin: '0 auto' }} />
                <p className="text-sm mt-2" style={{ color: styles.textSecondary }}>
                  Click or drag files to upload
                </p>
                <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                  PDF, Word, Excel, Images (max 10MB each)
                </p>
              </div>

              {/* Pending attachments (not yet uploaded) */}
              {pendingAttachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium" style={{ color: styles.textMuted }}>
                    PENDING UPLOAD
                  </p>
                  {pendingAttachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(file)}
                        <span
                          className="text-sm truncate"
                          style={{ color: styles.textPrimary }}
                        >
                          {file.name}
                        </span>
                        <span className="text-xs flex-shrink-0" style={{ color: styles.textMuted }}>
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        style={{ color: styles.error }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Uploaded attachments */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium" style={{ color: styles.textMuted }}>
                    UPLOADED
                  </p>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(attachment)}
                        <span
                          className="text-sm truncate"
                          style={{ color: styles.textPrimary }}
                        >
                          {attachment.name}
                        </span>
                        {attachment.size && (
                          <span className="text-xs flex-shrink-0" style={{ color: styles.textMuted }}>
                            ({(attachment.size / 1024).toFixed(0)} KB)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          style={{ color: styles.info }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DownloadSimple size={16} />
                        </a>
                        <button
                          type="button"
                          onClick={() => removeUploadedAttachment(attachment.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          style={{ color: styles.error }}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
                Attach spec sheets, certificates, or terms. Visible to the buyer.
              </p>
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div
          className="flex-shrink-0 px-6 py-4 border-t"
          style={{
            borderColor: styles.borderLight,
            backgroundColor: styles.bgPrimary,
          }}
        >
          {/* Status feedback bar */}
          {submitStatus !== 'idle' && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 transition-all duration-100 ${
                submitStatus === 'success' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
              }`}
            >
              {submitStatus === 'success' ? (
                <CheckCircle
                  size={16}
                  weight="fill"
                  className="text-green-600 dark:text-green-400 flex-shrink-0"
                />
              ) : (
                <WarningCircle
                  size={16}
                  weight="fill"
                  className="text-red-600 dark:text-red-400 flex-shrink-0"
                />
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

          <div className="flex gap-3">
            {/* Save Draft Button (Secondary) */}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-100 disabled:opacity-50"
              style={{
                backgroundColor: styles.bgSecondary,
                color: styles.textPrimary,
                border: `1px solid ${styles.border}`,
                minWidth: '120px',
              }}
            >
              {isSubmitting ? (
                <Spinner size={18} className="animate-spin" />
              ) : (
                <FloppyDisk size={18} />
              )}
              Save Draft
            </button>

            {/* Send Quote Button (Primary) */}
            <button
              type="button"
              onClick={handleSendQuote}
              disabled={isSubmitting || !formData.unitPrice || formData.unitPrice <= 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-100 disabled:opacity-50"
              style={{
                backgroundColor: formData.unitPrice > 0 ? styles.success : styles.bgSecondary,
                color: formData.unitPrice > 0 ? '#fff' : styles.textMuted,
              }}
              title={sendValidation.reason}
            >
              {isSubmitting ? (
                <Spinner size={18} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={18} weight="fill" />
              )}
              Send Quote
            </button>
          </div>

          {/* Disabled reason hint */}
          {formData.unitPrice <= 0 && (
            <p className="text-xs mt-2 text-center" style={{ color: styles.textMuted }}>
              Enter a unit price to send quote
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default QuoteFormPanel;
