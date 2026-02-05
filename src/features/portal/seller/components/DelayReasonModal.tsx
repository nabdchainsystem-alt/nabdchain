import React, { useState, useEffect } from 'react';
import {
  X,
  Warning,
  Cube,
  Factory,
  Truck,
  FileText,
  CloudRain,
  User,
  Gear,
  MagnifyingGlass,
  MapPin,
  CurrencyDollar,
  Files,
  DotsThree,
  CalendarBlank,
  NotePencil,
  CheckCircle,
  Clock,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { Order } from '../../types/order.types';
import {
  DelayReasonCode,
  TimelineStepKey,
  DELAY_REASON_CONFIGS,
} from '../../types/timeline.types';

// =============================================================================
// Types
// =============================================================================

interface DelayReasonModalProps {
  isOpen: boolean;
  order: Order;
  onClose: () => void;
  onSubmit: (data: DelayReasonData) => Promise<void>;
}

export interface DelayReasonData {
  reasonCode: DelayReasonCode;
  customReason?: string;
  affectedStep: TimelineStepKey;
  estimatedResolution?: string;
  impactDays: number;
  notes?: string;
}

// =============================================================================
// Icon Mapping
// =============================================================================

const REASON_ICONS: Record<string, React.ElementType> = {
  Cube: Cube,
  Factory: Factory,
  Truck: Truck,
  FileText: FileText,
  CloudRain: CloudRain,
  User: User,
  Gear: Gear,
  MagnifyingGlass: MagnifyingGlass,
  MapPin: MapPin,
  CurrencyDollar: CurrencyDollar,
  Files: Files,
  DotsThree: DotsThree,
};

// =============================================================================
// Delay Reasons Grouped by Category
// =============================================================================

const DELAY_REASONS_BY_CATEGORY = {
  supplier: [
    { code: 'supplier_stockout' as DelayReasonCode, ...DELAY_REASON_CONFIGS.supplier_stockout },
    { code: 'production_delay' as DelayReasonCode, ...DELAY_REASON_CONFIGS.production_delay },
  ],
  logistics: [
    { code: 'carrier_delay' as DelayReasonCode, ...DELAY_REASON_CONFIGS.carrier_delay },
    { code: 'customs_clearance' as DelayReasonCode, ...DELAY_REASON_CONFIGS.customs_clearance },
  ],
  buyer: [
    { code: 'buyer_request' as DelayReasonCode, ...DELAY_REASON_CONFIGS.buyer_request },
    { code: 'address_issue' as DelayReasonCode, ...DELAY_REASON_CONFIGS.address_issue },
    { code: 'payment_hold' as DelayReasonCode, ...DELAY_REASON_CONFIGS.payment_hold },
  ],
  internal: [
    { code: 'internal_processing' as DelayReasonCode, ...DELAY_REASON_CONFIGS.internal_processing },
    { code: 'quality_check' as DelayReasonCode, ...DELAY_REASON_CONFIGS.quality_check },
    { code: 'documentation' as DelayReasonCode, ...DELAY_REASON_CONFIGS.documentation },
  ],
  external: [
    { code: 'weather' as DelayReasonCode, ...DELAY_REASON_CONFIGS.weather },
    { code: 'other' as DelayReasonCode, ...DELAY_REASON_CONFIGS.other },
  ],
};

const CATEGORY_LABELS: Record<string, string> = {
  supplier: 'Supplier Issues',
  logistics: 'Logistics & Shipping',
  buyer: 'Buyer Related',
  internal: 'Internal Operations',
  external: 'External Factors',
};

// =============================================================================
// Affected Step Options
// =============================================================================

const AFFECTED_STEPS: { key: TimelineStepKey; label: string }[] = [
  { key: 'seller_confirmed', label: 'Order Confirmation' },
  { key: 'processing_started', label: 'Processing' },
  { key: 'shipped', label: 'Shipping' },
  { key: 'delivered', label: 'Delivery' },
];

// =============================================================================
// Component
// =============================================================================

export const DelayReasonModal: React.FC<DelayReasonModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
}) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const [selectedReason, setSelectedReason] = useState<DelayReasonCode | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [affectedStep, setAffectedStep] = useState<TimelineStepKey>('shipped');
  const [estimatedResolution, setEstimatedResolution] = useState('');
  const [impactDays, setImpactDays] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'reason' | 'details'>('reason');

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
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Reset state when closing
        setSelectedReason(null);
        setCustomReason('');
        setStep('reason');
        setNotes('');
        setImpactDays(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Determine default affected step based on order status
  useEffect(() => {
    if (order) {
      switch (order.status) {
        case 'pending_confirmation':
          setAffectedStep('seller_confirmed');
          break;
        case 'confirmed':
        case 'processing':
        case 'in_progress':
          setAffectedStep('shipped');
          break;
        case 'shipped':
          setAffectedStep('delivered');
          break;
        default:
          setAffectedStep('shipped');
      }
    }
  }, [order]);

  const handleSelectReason = (code: DelayReasonCode) => {
    setSelectedReason(code);
    setStep('details');
  };

  const handleBack = () => {
    setStep('reason');
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        reasonCode: selectedReason,
        customReason: selectedReason === 'other' ? customReason : undefined,
        affectedStep,
        estimatedResolution: estimatedResolution || undefined,
        impactDays,
        notes: notes || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit delay reason:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const selectedReasonConfig = selectedReason ? DELAY_REASON_CONFIGS[selectedReason] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isAnimating ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        dir={direction}
      >
        <div
          className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: styles.bgCard,
            transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
            opacity: isAnimating ? 1 : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: styles.border }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${styles.warning}15` }}
              >
                <Warning size={20} weight="fill" style={{ color: styles.warning }} />
              </div>
              <div>
                <h2 className="font-semibold" style={{ color: styles.textPrimary }}>
                  Report Delay
                </h2>
                <p className="text-sm" style={{ color: styles.textMuted }}>
                  {order.orderNumber}
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
          <div className="max-h-[60vh] overflow-y-auto">
            {step === 'reason' ? (
              /* Step 1: Select Reason */
              <div className="p-4 space-y-4">
                {Object.entries(DELAY_REASONS_BY_CATEGORY).map(([category, reasons]) => (
                  <div key={category}>
                    <p
                      className="text-xs font-medium mb-2 px-1"
                      style={{ color: styles.textMuted }}
                    >
                      {CATEGORY_LABELS[category]}
                    </p>
                    <div className="space-y-1">
                      {reasons.map((reason) => {
                        const Icon = REASON_ICONS[reason.icon] || DotsThree;
                        return (
                          <button
                            key={reason.code}
                            onClick={() => handleSelectReason(reason.code)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                            style={{ backgroundColor: styles.bgSecondary }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = styles.bgHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = styles.bgSecondary;
                            }}
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: styles.bgCard }}
                            >
                              <Icon size={18} style={{ color: styles.textSecondary }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium"
                                style={{ color: styles.textPrimary }}
                              >
                                {reason.label}
                              </p>
                              <p
                                className="text-xs truncate"
                                style={{ color: styles.textMuted }}
                              >
                                {reason.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Step 2: Delay Details */
              <div className="p-4 space-y-4">
                {/* Selected Reason */}
                {selectedReasonConfig && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${styles.warning}10` }}
                  >
                    {(() => {
                      const Icon = REASON_ICONS[selectedReasonConfig.icon] || DotsThree;
                      return <Icon size={20} style={{ color: styles.warning }} />;
                    })()}
                    <div>
                      <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
                        {selectedReasonConfig.label}
                      </p>
                      <button
                        onClick={handleBack}
                        className="text-xs"
                        style={{ color: styles.info }}
                      >
                        Change reason
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Reason (for "other") */}
                {selectedReason === 'other' && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: styles.textPrimary }}
                    >
                      Describe the reason
                    </label>
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Enter reason..."
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: styles.border,
                        backgroundColor: styles.bgSecondary,
                        color: styles.textPrimary,
                      }}
                    />
                  </div>
                )}

                {/* Affected Step */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: styles.textPrimary }}
                  >
                    Affected Step
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AFFECTED_STEPS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setAffectedStep(s.key)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors"
                        style={{
                          borderColor: affectedStep === s.key ? styles.info : styles.border,
                          backgroundColor: affectedStep === s.key ? `${styles.info}10` : styles.bgSecondary,
                          color: affectedStep === s.key ? styles.info : styles.textSecondary,
                        }}
                      >
                        {affectedStep === s.key && <CheckCircle size={14} weight="fill" />}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Impact Days */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: styles.textPrimary }}
                  >
                    Expected Delay (days)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setImpactDays(Math.max(1, impactDays - 1))}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center"
                      style={{ borderColor: styles.border, color: styles.textSecondary }}
                    >
                      -
                    </button>
                    <div
                      className="flex-1 text-center py-2 rounded-lg"
                      style={{ backgroundColor: styles.bgSecondary }}
                    >
                      <span className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
                        {impactDays}
                      </span>
                      <span className="text-sm ml-1" style={{ color: styles.textMuted }}>
                        {impactDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                    <button
                      onClick={() => setImpactDays(impactDays + 1)}
                      className="w-10 h-10 rounded-lg border flex items-center justify-center"
                      style={{ borderColor: styles.border, color: styles.textSecondary }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Estimated Resolution Date */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: styles.textPrimary }}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarBlank size={14} />
                      Estimated Resolution
                    </span>
                  </label>
                  <input
                    type="date"
                    value={estimatedResolution}
                    onChange={(e) => setEstimatedResolution(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgSecondary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: styles.textPrimary }}
                  >
                    <span className="flex items-center gap-2">
                      <NotePencil size={14} />
                      Additional Notes
                    </span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional details..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgSecondary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'details' && (
            <div
              className="flex items-center gap-3 px-5 py-4 border-t"
              style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
            >
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border"
                style={{ borderColor: styles.border, color: styles.textSecondary }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (selectedReason === 'other' && !customReason)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: styles.warning }}
              >
                {isSubmitting ? (
                  <>
                    <Clock size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Warning size={16} />
                    Report Delay
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DelayReasonModal;
