import React, { useState } from 'react';
import { Check, CircleNotch, CheckCircle, Warning, ArrowLeft } from 'phosphor-react';
import { Container, PageHeader, Button, PortalDatePicker } from '../../components';
import { Select } from '../../components/ui/Select';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import { itemService } from '../../services/itemService';
import { ThemeStyles } from '../../../../theme/portalColors';

interface RequestQuoteProps {
  onNavigate: (page: string) => void;
}

interface RFQFormData {
  partName: string;
  partNumber: string;
  manufacturer: string;
  quantity: number;
  description: string;
  deliveryLocation: string;
  deliveryCity: string;
  deliveryCountry: string;
  requiredDeliveryDate: string;
  priority: 'normal' | 'urgent' | 'critical';
}

export const RequestQuote: React.FC<RequestQuoteProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'details' | 'review' | 'success'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_createdRfqId, setCreatedRfqId] = useState<string | null>(null);
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRtl = direction === 'rtl';

  const [formData, setFormData] = useState<RFQFormData>({
    partName: '',
    partNumber: '',
    manufacturer: '',
    quantity: 1,
    description: '',
    deliveryLocation: '',
    deliveryCity: '',
    deliveryCountry: 'SA',
    requiredDeliveryDate: '',
    priority: 'normal',
  });

  const handleChange = (field: keyof RFQFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.partName.trim()) {
      setError('Part name is required');
      return false;
    }
    if (formData.quantity < 1) {
      setError('Quantity must be at least 1');
      return false;
    }
    if (!formData.deliveryLocation.trim()) {
      setError('Delivery location is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Convert date from YYYY-MM-DD to ISO datetime format if provided
      let isoDeliveryDate: string | undefined;
      if (formData.requiredDeliveryDate) {
        // Add time component to make it a valid ISO datetime
        isoDeliveryDate = new Date(formData.requiredDeliveryDate + 'T00:00:00.000Z').toISOString();
      }

      // Create the RFQ - this is a general RFQ not tied to a specific item
      const rfq = await itemService.createRFQ(token, {
        itemId: null, // General RFQ, not tied to specific item
        sellerId: null, // Will be broadcast to all matching sellers
        quantity: formData.quantity,
        deliveryLocation: formData.deliveryLocation,
        deliveryCity: formData.deliveryCity || undefined,
        deliveryCountry: formData.deliveryCountry,
        requiredDeliveryDate: isoDeliveryDate,
        message:
          `Part: ${formData.partName}\nPart Number: ${formData.partNumber || 'N/A'}\nManufacturer: ${formData.manufacturer || 'Any'}\n\n${formData.description || ''}`.trim(),
        priority: formData.priority,
        source: 'profile',
      });

      setCreatedRfqId(rfq.id);
      setStep('success');
    } catch (err) {
      console.error('Failed to create RFQ:', err);
      setError(err instanceof Error ? err.message : 'Failed to create RFQ. Please try again.');
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

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('buyer.rfq.title') || 'Request Quote'}
          subtitle={t('buyer.rfq.subtitle') || 'Submit a request for quotation to suppliers'}
          actions={
            <Button variant="secondary" onClick={() => onNavigate('my-rfqs')}>
              <ArrowLeft size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
              Back to My RFQs
            </Button>
          }
        />

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <StepIndicator
            number={1}
            label="Details"
            active={step === 'details'}
            completed={step === 'review' || step === 'success'}
            styles={styles}
          />
          <div className="w-12 h-px" style={{ backgroundColor: styles.border }} />
          <StepIndicator
            number={2}
            label="Review"
            active={step === 'review'}
            completed={step === 'success'}
            styles={styles}
          />
          <div className="w-12 h-px" style={{ backgroundColor: styles.border }} />
          <StepIndicator number={3} label="Done" active={step === 'success'} completed={false} styles={styles} />
        </div>

        {/* Step Content */}
        <div
          className="rounded-lg border p-8 max-w-2xl mx-auto transition-colors"
          style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
        >
          {/* Error Message */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <Warning size={20} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444' }}>{error}</span>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-6" style={{ color: styles.textPrimary }}>
                What do you need?
              </h2>

              {/* Part Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Part Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.partName}
                  onChange={(e) => handleChange('partName', e.target.value)}
                  placeholder="e.g., Hydraulic Pump, Ball Bearing, Electric Motor"
                  className="w-full px-3 py-2.5 rounded-md border outline-none text-sm"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgPrimary,
                    color: styles.textPrimary,
                  }}
                />
              </div>

              {/* Part Number & Manufacturer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                    Part Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.partNumber}
                    onChange={(e) => handleChange('partNumber', e.target.value)}
                    placeholder="e.g., SKF-6205-2RS"
                    className="w-full px-3 py-2.5 rounded-md border outline-none text-sm"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                    Manufacturer (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    placeholder="e.g., SKF, NSK, Siemens"
                    className="w-full px-3 py-2.5 rounded-md border outline-none text-sm"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Quantity & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                    Quantity <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 rounded-md border outline-none text-sm"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                    Priority
                  </label>
                  <Select
                    value={formData.priority}
                    onChange={(value) => handleChange('priority', value)}
                    options={[
                      { value: 'normal', label: 'Normal' },
                      { value: 'urgent', label: 'Urgent' },
                      { value: 'critical', label: 'Critical' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Delivery Location */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Delivery Location <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.deliveryLocation}
                  onChange={(e) => handleChange('deliveryLocation', e.target.value)}
                  placeholder="Full address or area"
                  className="w-full px-3 py-2.5 rounded-md border outline-none text-sm"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgPrimary,
                    color: styles.textPrimary,
                  }}
                />
              </div>

              {/* City & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryCity}
                    onChange={(e) => handleChange('deliveryCity', e.target.value)}
                    placeholder="e.g., Riyadh, Jeddah"
                    className="w-full px-3 py-2.5 rounded-md border outline-none text-sm"
                    style={{
                      borderColor: styles.border,
                      backgroundColor: styles.bgPrimary,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                    Country
                  </label>
                  <Select
                    value={formData.deliveryCountry}
                    onChange={(value) => handleChange('deliveryCountry', value)}
                    options={[
                      { value: 'SA', label: 'Saudi Arabia' },
                      { value: 'AE', label: 'UAE' },
                      { value: 'KW', label: 'Kuwait' },
                      { value: 'BH', label: 'Bahrain' },
                      { value: 'QA', label: 'Qatar' },
                      { value: 'OM', label: 'Oman' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Required Delivery Date */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Required Delivery Date (Optional)
                </label>
                <PortalDatePicker
                  value={formData.requiredDeliveryDate}
                  onChange={(value) => handleChange('requiredDeliveryDate', value)}
                  minDate={getMinDate()}
                  className="w-full"
                />
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: styles.textPrimary }}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Any specifications, requirements, or notes for suppliers..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-md border outline-none text-sm resize-none"
                  style={{
                    borderColor: styles.border,
                    backgroundColor: styles.bgPrimary,
                    color: styles.textPrimary,
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4">
                <Button onClick={() => validateForm() && setStep('review')}>Continue to Review</Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-6" style={{ color: styles.textPrimary }}>
                Review Your RFQ
              </h2>

              <div
                className="rounded-lg border p-6 space-y-4"
                style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
              >
                <ReviewRow label="Part Name" value={formData.partName} styles={styles} />
                <ReviewRow label="Part Number" value={formData.partNumber || 'Not specified'} styles={styles} />
                <ReviewRow label="Manufacturer" value={formData.manufacturer || 'Any'} styles={styles} />
                <ReviewRow label="Quantity" value={formData.quantity.toString()} styles={styles} />
                <ReviewRow
                  label="Priority"
                  value={formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                  styles={styles}
                />
                <ReviewRow label="Delivery Location" value={formData.deliveryLocation} styles={styles} />
                <ReviewRow label="City" value={formData.deliveryCity || 'Not specified'} styles={styles} />
                <ReviewRow label="Country" value={formData.deliveryCountry} styles={styles} />
                <ReviewRow label="Required By" value={formData.requiredDeliveryDate || 'Flexible'} styles={styles} />
                {formData.description && (
                  <div>
                    <div className="text-sm" style={{ color: styles.textSecondary }}>
                      Additional Details
                    </div>
                    <div className="text-sm mt-1" style={{ color: styles.textPrimary }}>
                      {formData.description}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="secondary" onClick={() => setStep('details')}>
                  Back to Edit
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <CircleNotch size={16} className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit RFQ'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
              >
                <CheckCircle size={40} weight="fill" style={{ color: '#22c55e' }} />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: styles.textPrimary }}>
                RFQ Submitted Successfully!
              </h2>
              <p className="text-sm mb-8" style={{ color: styles.textSecondary }}>
                Your request for quotation has been sent to matching suppliers. You'll receive quotes in your inbox.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep('details');
                    setFormData({
                      partName: '',
                      partNumber: '',
                      manufacturer: '',
                      quantity: 1,
                      description: '',
                      deliveryLocation: '',
                      deliveryCity: '',
                      deliveryCountry: 'SA',
                      requiredDeliveryDate: '',
                      priority: 'normal',
                    });
                  }}
                >
                  Create Another RFQ
                </Button>
                <Button onClick={() => onNavigate('my-rfqs')}>View My RFQs</Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

const StepIndicator: React.FC<{
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
  styles: ThemeStyles;
}> = ({ number, label, active, completed, styles }) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
        style={{
          backgroundColor: active || completed ? (styles.isDark ? '#E6E8EB' : '#0F1115') : styles.bgSecondary,
          color: active || completed ? (styles.isDark ? '#0F1115' : '#E6E8EB') : styles.textMuted,
        }}
      >
        {completed ? <Check size={16} weight="bold" /> : number}
      </div>
      <span
        className="text-sm font-medium hidden sm:block"
        style={{ color: active ? styles.textPrimary : styles.textMuted }}
      >
        {label}
      </span>
    </div>
  );
};

const ReviewRow: React.FC<{ label: string; value: string; styles: ThemeStyles }> = ({ label, value, styles }) => (
  <div className="flex justify-between">
    <span className="text-sm" style={{ color: styles.textSecondary }}>
      {label}
    </span>
    <span className="text-sm font-medium" style={{ color: styles.textPrimary }}>
      {value}
    </span>
  </div>
);

export default RequestQuote;
