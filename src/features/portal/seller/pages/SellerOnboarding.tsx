// =============================================================================
// Seller Onboarding Wizard
// 6-step onboarding process for new sellers
// =============================================================================

import React, { useState, useEffect } from 'react';
import { featureLogger } from '../../../../utils/logger';
import {
  Buildings,
  MapPin,
  Phone,
  Bank,
  FileText,
  Storefront,
  Check,
  ArrowRight,
  ArrowLeft,
  Spinner,
  Warning,
  Image,
  Info,
  CheckCircle,
  CloudArrowUp,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { portalAuthService } from '../../services/portalAuthService';
import { PortalDatePicker } from '../../components';

// =============================================================================
// Types
// =============================================================================

interface _StepData {
  step1?: CompanyLegalInfo;
  step2?: NationalAddress;
  step3?: BusinessContacts;
  step4?: BankingPayout;
  step5?: Documents;
  step6?: PublicStorefront;
}

interface CompanyLegalInfo {
  legalName: string;
  crNumber: string;
  companyType: string;
  vatNumber?: string;
  dateOfEstablishment?: string;
}

interface NationalAddress {
  country: string;
  city: string;
  district: string;
  street: string;
  buildingNumber: string;
  postalCode: string;
}

interface BusinessContacts {
  businessEmail: string;
  phone: string;
  whatsapp?: string;
  supportContactName?: string;
}

interface BankingPayout {
  bankName: string;
  accountHolderName: string;
  iban: string;
}

interface Documents {
  crDocumentUrl?: string;
  vatCertificateUrl?: string;
  addressProofUrl?: string;
}

interface PublicStorefront {
  logoUrl?: string;
  coverUrl?: string;
  shortDescription: string;
  slug: string;
}

// =============================================================================
// Constants
// =============================================================================

const COMPANY_TYPES = [
  { value: 'llc', label: 'Limited Liability Company (LLC)' },
  { value: 'establishment', label: 'Sole Establishment' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'branch', label: 'Foreign Company Branch' },
];

const SAUDI_BANKS = [
  'Al Rajhi Bank',
  'Saudi National Bank (SNB)',
  'Riyad Bank',
  'Saudi British Bank (SABB)',
  'Banque Saudi Fransi',
  'Arab National Bank',
  'Alinma Bank',
  'Bank AlJazira',
  'Bank Albilad',
  'Gulf International Bank',
];

const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'QA', name: 'Qatar' },
];

// Steps are now defined inside component to use translations
const getSteps = (t: (key: string) => string) => [
  {
    id: 1,
    title: t('seller.onboarding.stepCompanyInfo'),
    icon: Buildings,
    description: t('seller.onboarding.stepCompanyInfoDesc'),
  },
  {
    id: 2,
    title: t('seller.onboarding.stepAddress'),
    icon: MapPin,
    description: t('seller.onboarding.stepAddressDesc'),
  },
  {
    id: 3,
    title: t('seller.onboarding.stepContacts'),
    icon: Phone,
    description: t('seller.onboarding.stepContactsDesc'),
  },
  { id: 4, title: t('seller.onboarding.stepBanking'), icon: Bank, description: t('seller.onboarding.stepBankingDesc') },
  {
    id: 5,
    title: t('seller.onboarding.stepDocuments'),
    icon: FileText,
    description: t('seller.onboarding.stepDocumentsDesc'),
  },
  {
    id: 6,
    title: t('seller.onboarding.stepStorefront'),
    icon: Storefront,
    description: t('seller.onboarding.stepStorefrontDesc'),
  },
];

// =============================================================================
// Reusable Form Field Components (defined OUTSIDE main component to prevent re-renders)
// =============================================================================

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  styles: Record<string, string>;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  hint,
  styles,
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium" style={{ color: styles.textPrimary }}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'date' ? (
      <PortalDatePicker value={value} onChange={onChange} className="w-full" />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg border px-3 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all"
        style={{
          borderColor: styles.border,
          color: styles.textPrimary,
          backgroundColor: styles.bgCard,
        }}
      />
    )}
    {hint && (
      <p className="text-xs" style={{ color: styles.textMuted }}>
        {hint}
      </p>
    )}
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  styles: Record<string, string>;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = 'Select...',
  styles,
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium" style={{ color: styles.textPrimary }}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all"
      style={{
        borderColor: styles.border,
        color: styles.textPrimary,
        backgroundColor: styles.bgCard,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface FileUploadFieldProps {
  label: string;
  value?: string;
  onUpload: (file: File) => void;
  required?: boolean;
  accept?: string;
  hint?: string;
  styles: Record<string, string>;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  value,
  onUpload,
  required,
  accept = '.pdf,.jpg,.jpeg,.png',
  hint,
  styles,
}) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium" style={{ color: styles.textPrimary }}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div
      className="border-2 border-dashed rounded-lg p-4 text-center"
      style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
    >
      {value ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle size={20} className="text-green-500" weight="fill" />
          <span className="text-sm" style={{ color: styles.textPrimary }}>
            File uploaded
          </span>
        </div>
      ) : (
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            className="hidden"
          />
          <CloudArrowUp size={32} className="mx-auto mb-2" style={{ color: styles.textMuted }} />
          <p className="text-sm" style={{ color: styles.textMuted }}>
            Click to upload or drag and drop
          </p>
          <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
            PDF, JPG, PNG (max 10MB)
          </p>
        </label>
      )}
    </div>
    {hint && (
      <p className="text-xs" style={{ color: styles.textMuted }}>
        {hint}
      </p>
    )}
  </div>
);

// =============================================================================
// Component
// =============================================================================

export const SellerOnboarding: React.FC = () => {
  const { styles, direction, t } = usePortal();
  const _isRTL = direction === 'rtl';
  const STEPS = getSteps(t);

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Form data for each step
  const [step1Data, setStep1Data] = useState<CompanyLegalInfo>({
    legalName: '',
    crNumber: '',
    companyType: '',
    vatNumber: '',
    dateOfEstablishment: '',
  });

  const [step2Data, setStep2Data] = useState<NationalAddress>({
    country: 'SA',
    city: '',
    district: '',
    street: '',
    buildingNumber: '',
    postalCode: '',
  });

  const [step3Data, setStep3Data] = useState<BusinessContacts>({
    businessEmail: '',
    phone: '',
    whatsapp: '',
    supportContactName: '',
  });

  const [step4Data, setStep4Data] = useState<BankingPayout>({
    bankName: '',
    accountHolderName: '',
    iban: '',
  });

  const [step5Data, setStep5Data] = useState<Documents>({
    crDocumentUrl: '',
    vatCertificateUrl: '',
    addressProofUrl: '',
  });

  const [step6Data, setStep6Data] = useState<PublicStorefront>({
    logoUrl: '',
    coverUrl: '',
    shortDescription: '',
    slug: '',
  });

  // Load existing onboarding state
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const userId = localStorage.getItem('portal_user_id');
        if (!userId) {
          setError('Please log in to continue your store setup.');
          setLoading(false);
          return;
        }

        const result = await portalAuthService.getOnboardingState(userId);
        if (result.success && result.data) {
          const { stepData, completedSteps: completed, onboardingStep } = result.data;
          if (stepData.step1) setStep1Data(stepData.step1);
          if (stepData.step2) setStep2Data(stepData.step2);
          if (stepData.step3) setStep3Data(stepData.step3);
          if (stepData.step4) setStep4Data(stepData.step4);
          if (stepData.step5) setStep5Data(stepData.step5);
          if (stepData.step6) setStep6Data(stepData.step6);
          setCompletedSteps(completed || []);
          setCurrentStep(onboardingStep || 1);
          setError(null); // Clear any previous errors
        } else if (!result.success) {
          // Profile will be auto-created by backend, just continue
          featureLogger.info('Onboarding state not found, will be created on save');
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
        // Don't show error on load failure - user can still fill the form
      }
      setLoading(false);
    };

    loadOnboardingState();
  }, []);

  // Validation for each step
  const isStep1Valid = step1Data.legalName && step1Data.crNumber && step1Data.companyType;
  const isStep2Valid =
    step2Data.country && step2Data.city && step2Data.street && step2Data.buildingNumber && step2Data.postalCode;
  const isStep3Valid = step3Data.businessEmail && step3Data.phone;
  const isStep4Valid = step4Data.bankName && step4Data.accountHolderName && step4Data.iban;
  const isStep5Valid = !!step5Data.crDocumentUrl;
  const isStep6Valid = step6Data.shortDescription && step6Data.slug;

  const isCurrentStepValid = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
      case 5:
        return isStep5Valid;
      case 6:
        return isStep6Valid;
      default:
        return false;
    }
  };

  // Get current step data
  const getCurrentStepData = () => {
    switch (currentStep) {
      case 1:
        return step1Data;
      case 2:
        return step2Data;
      case 3:
        return step3Data;
      case 4:
        return step4Data;
      case 5:
        return step5Data;
      case 6:
        return step6Data;
      default:
        return {};
    }
  };

  // Save current step to backend
  const saveCurrentStep = async (): Promise<boolean> => {
    const userId = localStorage.getItem('portal_user_id');
    if (!userId) {
      setError('User not authenticated');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const stepData = getCurrentStepData();
      const result = await portalAuthService.saveOnboardingStep(userId, currentStep, stepData);

      if (result.success) {
        if (result.completedSteps) {
          setCompletedSteps(result.completedSteps);
        }
        setSaving(false);
        return true;
      } else {
        setError(result.error?.message || 'Failed to save step');
        setSaving(false);
        return false;
      }
    } catch (_err) {
      setError('Network error. Please try again.');
      setSaving(false);
      return false;
    }
  };

  // Handle next step with auto-save
  const handleNext = async () => {
    if (!isCurrentStepValid()) return;

    // Save current step before moving to next
    const saved = await saveCurrentStep();
    if (!saved) return;

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const _handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save on blur (debounced auto-save)
  const _handleFieldBlur = async () => {
    if (isCurrentStepValid()) {
      await saveCurrentStep();
    }
  };

  // Handle submit for review
  const handleSubmit = async () => {
    if (!isStep6Valid) return;

    setSubmitting(true);
    setError(null);

    try {
      const userId = localStorage.getItem('portal_user_id');
      if (!userId) {
        setError('User not authenticated');
        setSubmitting(false);
        return;
      }

      // First save step 6 data
      const saveResult = await portalAuthService.saveOnboardingStep(userId, 6, step6Data);
      if (!saveResult.success) {
        setError('Failed to save storefront data');
        setSubmitting(false);
        return;
      }

      // Then submit for review
      const result = await portalAuthService.submitOnboarding(userId);
      if (result.success) {
        // Clear incomplete status and redirect to dashboard
        localStorage.removeItem('seller_status');
        localStorage.setItem('seller_status', 'pending_review');
        // Reload to show dashboard with verification banner
        window.location.reload();
      } else {
        setError(result.error?.message || 'Failed to submit onboarding');
      }
    } catch (_err) {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  // File upload handler (mock)
  const handleFileUpload = (field: keyof Documents, file: File) => {
    // In production, this would upload to a file storage service
    const fakeUrl = URL.createObjectURL(file);
    setStep5Data((prev) => ({ ...prev, [field]: fakeUrl }));
  };

  // Step content renderers
  const renderStep1 = () => (
    <div className="space-y-4">
      <InputField
        label={t('seller.onboarding.legalCompanyName')}
        value={step1Data.legalName}
        onChange={(v: string) => setStep1Data((prev) => ({ ...prev, legalName: v }))}
        placeholder={t('seller.onboarding.legalCompanyNamePlaceholder')}
        required
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.crNumber')}
        value={step1Data.crNumber}
        onChange={(v: string) => setStep1Data((prev) => ({ ...prev, crNumber: v }))}
        placeholder={t('seller.onboarding.crNumberPlaceholder')}
        required
        hint={t('seller.onboarding.crNumberHint')}
        styles={styles}
      />
      <SelectField
        label={t('seller.onboarding.companyType')}
        value={step1Data.companyType}
        onChange={(v: string) => setStep1Data((prev) => ({ ...prev, companyType: v }))}
        options={COMPANY_TYPES}
        required
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.vatNumber')}
        value={step1Data.vatNumber || ''}
        onChange={(v: string) => setStep1Data((prev) => ({ ...prev, vatNumber: v }))}
        placeholder={t('seller.onboarding.vatNumberPlaceholder')}
        hint={t('seller.onboarding.vatNumberHint')}
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.dateOfEstablishment')}
        value={step1Data.dateOfEstablishment || ''}
        onChange={(v: string) => setStep1Data((prev) => ({ ...prev, dateOfEstablishment: v }))}
        type="date"
        styles={styles}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <SelectField
        label={t('seller.onboarding.country')}
        value={step2Data.country}
        onChange={(v: string) => setStep2Data((prev) => ({ ...prev, country: v }))}
        options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
        required
        styles={styles}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={t('seller.onboarding.city')}
          value={step2Data.city}
          onChange={(v: string) => setStep2Data((prev) => ({ ...prev, city: v }))}
          placeholder={t('seller.onboarding.cityPlaceholder')}
          required
          styles={styles}
        />
        <InputField
          label={t('seller.onboarding.district')}
          value={step2Data.district}
          onChange={(v: string) => setStep2Data((prev) => ({ ...prev, district: v }))}
          placeholder={t('seller.onboarding.districtPlaceholder')}
          styles={styles}
        />
      </div>
      <InputField
        label={t('seller.onboarding.streetAddress')}
        value={step2Data.street}
        onChange={(v: string) => setStep2Data((prev) => ({ ...prev, street: v }))}
        placeholder={t('seller.onboarding.streetAddressPlaceholder')}
        required
        styles={styles}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label={t('seller.onboarding.buildingNumber')}
          value={step2Data.buildingNumber}
          onChange={(v: string) => setStep2Data((prev) => ({ ...prev, buildingNumber: v }))}
          placeholder={t('seller.onboarding.buildingNumberPlaceholder')}
          required
          styles={styles}
        />
        <InputField
          label={t('seller.onboarding.postalCode')}
          value={step2Data.postalCode}
          onChange={(v: string) => setStep2Data((prev) => ({ ...prev, postalCode: v }))}
          placeholder={t('seller.onboarding.postalCodePlaceholder')}
          required
          styles={styles}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <InputField
        label={t('seller.onboarding.businessEmail')}
        value={step3Data.businessEmail}
        onChange={(v: string) => setStep3Data((prev) => ({ ...prev, businessEmail: v }))}
        placeholder={t('seller.onboarding.businessEmailPlaceholder')}
        type="email"
        required
        hint={t('seller.onboarding.businessEmailHint')}
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.phoneNumber')}
        value={step3Data.phone}
        onChange={(v: string) => setStep3Data((prev) => ({ ...prev, phone: v }))}
        placeholder={t('seller.onboarding.phoneNumberPlaceholder')}
        type="tel"
        required
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.whatsappNumber')}
        value={step3Data.whatsapp || ''}
        onChange={(v: string) => setStep3Data((prev) => ({ ...prev, whatsapp: v }))}
        placeholder={t('seller.onboarding.whatsappNumberPlaceholder')}
        type="tel"
        hint={t('seller.onboarding.whatsappNumberHint')}
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.supportContactName')}
        value={step3Data.supportContactName || ''}
        onChange={(v: string) => setStep3Data((prev) => ({ ...prev, supportContactName: v }))}
        placeholder={t('seller.onboarding.supportContactNamePlaceholder')}
        styles={styles}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: styles.bgSecondary }}>
        <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: styles.textMuted }} />
        <p className="text-xs" style={{ color: styles.textMuted }}>
          {t('seller.onboarding.bankingNotice')}
        </p>
      </div>
      <SelectField
        label={t('seller.onboarding.bankName')}
        value={step4Data.bankName}
        onChange={(v: string) => setStep4Data((prev) => ({ ...prev, bankName: v }))}
        options={SAUDI_BANKS.map((b) => ({ value: b, label: b }))}
        required
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.accountHolderName')}
        value={step4Data.accountHolderName}
        onChange={(v: string) => setStep4Data((prev) => ({ ...prev, accountHolderName: v }))}
        placeholder={t('seller.onboarding.accountHolderNamePlaceholder')}
        required
        hint={t('seller.onboarding.accountHolderNameHint')}
        styles={styles}
      />
      <InputField
        label={t('seller.onboarding.iban')}
        value={step4Data.iban}
        onChange={(v: string) => setStep4Data((prev) => ({ ...prev, iban: v.toUpperCase() }))}
        placeholder={t('seller.onboarding.ibanPlaceholder')}
        required
        hint={t('seller.onboarding.ibanHint')}
        styles={styles}
      />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <FileUploadField
        label={t('seller.onboarding.crDocument')}
        value={step5Data.crDocumentUrl}
        onUpload={(file: File) => handleFileUpload('crDocumentUrl', file)}
        required
        hint={t('seller.onboarding.crDocumentHint')}
        styles={styles}
      />
      {step1Data.vatNumber && (
        <FileUploadField
          label={t('seller.onboarding.vatCertificate')}
          value={step5Data.vatCertificateUrl}
          onUpload={(file: File) => handleFileUpload('vatCertificateUrl', file)}
          hint={t('seller.onboarding.vatCertificateHint')}
          styles={styles}
        />
      )}
      <FileUploadField
        label={t('seller.onboarding.addressProof')}
        value={step5Data.addressProofUrl}
        onUpload={(file: File) => handleFileUpload('addressProofUrl', file)}
        hint={t('seller.onboarding.addressProofHint')}
        styles={styles}
      />
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg ${styles.bgSecondary} flex items-start gap-2`}>
        <Storefront size={16} className={`mt-0.5 flex-shrink-0 ${styles.textMuted}`} />
        <p className={`text-xs ${styles.textMuted}`}>{t('seller.onboarding.storeNotice')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={`block text-sm font-medium ${styles.textPrimary}`}>
            {t('seller.onboarding.storeLogo')}
          </label>
          <div
            className={`w-24 h-24 border-2 border-dashed ${styles.border} rounded-lg flex items-center justify-center ${styles.bgCard}`}
          >
            {step6Data.logoUrl ? (
              <img src={step6Data.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <label className="cursor-pointer text-center p-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setStep6Data((prev) => ({ ...prev, logoUrl: URL.createObjectURL(e.target.files![0]) }));
                    }
                  }}
                  className="hidden"
                />
                <Image size={24} className={`mx-auto ${styles.textMuted}`} />
                <span className={`text-xs ${styles.textMuted}`}>{t('seller.onboarding.upload')}</span>
              </label>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={`block text-sm font-medium ${styles.textPrimary}`}>
            {t('seller.onboarding.coverImage')}
          </label>
          <div
            className={`w-full h-24 border-2 border-dashed ${styles.border} rounded-lg flex items-center justify-center ${styles.bgCard}`}
          >
            {step6Data.coverUrl ? (
              <img src={step6Data.coverUrl} alt="Cover" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <label className="cursor-pointer text-center p-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setStep6Data((prev) => ({ ...prev, coverUrl: URL.createObjectURL(e.target.files![0]) }));
                    }
                  }}
                  className="hidden"
                />
                <Image size={24} className={`mx-auto ${styles.textMuted}`} />
                <span className={`text-xs ${styles.textMuted}`}>{t('seller.onboarding.uploadCover')}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={`block text-sm font-medium ${styles.textPrimary}`}>
          {t('seller.onboarding.shortDescription')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={step6Data.shortDescription}
          onChange={(e) => setStep6Data((prev) => ({ ...prev, shortDescription: e.target.value.slice(0, 160) }))}
          placeholder={t('seller.onboarding.shortDescriptionPlaceholder')}
          rows={3}
          className={`w-full rounded-lg border ${styles.border} px-3 py-2 text-sm ${styles.textPrimary} ${styles.bgCard} placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 transition-all resize-none`}
        />
        <p className={`text-xs ${styles.textMuted}`}>
          {step6Data.shortDescription.length}/160 {t('seller.onboarding.characters')}
        </p>
      </div>

      <InputField
        label={t('seller.onboarding.storeUrlSlug')}
        value={step6Data.slug}
        onChange={(v: string) =>
          setStep6Data((prev) => ({ ...prev, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))
        }
        placeholder={t('seller.onboarding.storeUrlSlugPlaceholder')}
        required
        hint={`${t('seller.onboarding.storeUrlSlugHint')}${step6Data.slug || 'your-store-name'}`}
        styles={styles}
      />
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <div className={`min-h-screen ${styles.bgPrimary}`}>
      {/* Top Navigation Bar with Logo */}
      <div className={`border-b ${styles.border} ${styles.bgCard}`}>
        <div className="max-w-5xl mx-auto px-6 py-3">
          <button
            onClick={() => {
              // Go to seller portal home (clear incomplete status to exit onboarding)
              localStorage.removeItem('seller_status');
              localStorage.setItem('seller-portal-page', 'home');
              window.location.reload();
            }}
            className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-sm">N</span>
            </div>
            <span className="font-semibold" style={{ color: styles.textPrimary }}>
              NABD
            </span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className={`border-b ${styles.border} ${styles.bgCard}`}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${styles.bgSecondary} flex items-center justify-center`}>
              <Storefront size={20} className={styles.textPrimary} />
            </div>
            <div>
              <h1 className={`text-lg font-semibold ${styles.textPrimary}`}>Complete Your Store Setup</h1>
              <p className={`text-sm ${styles.textMuted}`}>Step {currentStep} of 6</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`border-b ${styles.border} ${styles.bgCard}`}>
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const canNavigate = isCompleted || step.id <= currentStep;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => canNavigate && setCurrentStep(step.id)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      isCurrent
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : isCompleted
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : canNavigate
                            ? 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                    }`}
                    disabled={!canNavigate}
                  >
                    {step.title}
                  </button>
                  {index < STEPS.length - 1 && <span className="text-zinc-300 dark:text-zinc-600">›</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Step Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <currentStepInfo.icon size={24} className={styles.textPrimary} />
            <h2 className={`text-xl font-semibold ${styles.textPrimary}`}>{currentStepInfo.title}</h2>
          </div>
          <p className={`text-sm ${styles.textMuted}`}>{currentStepInfo.description}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
            <div className="flex items-start gap-2">
              <Warning size={18} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{error}</span>
                {(error.includes('log in') || error.includes('User not found')) && (
                  <button
                    onClick={() => {
                      // Clear all portal credentials and redirect to login
                      localStorage.removeItem('portal_type');
                      localStorage.removeItem('portal_user_id');
                      localStorage.removeItem('portal_access_token');
                      localStorage.removeItem('portal_refresh_token');
                      localStorage.removeItem('seller_status');
                      localStorage.removeItem('mock_auth_token');
                      localStorage.removeItem('nabd_dev_mode');
                      window.location.reload();
                    }}
                    className="ml-2 underline hover:no-underline font-medium"
                  >
                    Go to Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className={`${styles.bgCard} border ${styles.border} rounded-xl p-6 mb-6`}>{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          {/* Back button - only shown on step 2+ */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700"
            >
              <ArrowLeft size={18} />
              {t('seller.onboarding.back')}
            </button>
          ) : (
            <div /> /* Empty div to maintain spacing */
          )}

          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              disabled={!isCurrentStepValid() || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                isCurrentStepValid() && !saving
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                  : `${styles.bgSecondary} ${styles.textMuted} cursor-not-allowed`
              }`}
            >
              {saving ? (
                <>
                  <Spinner size={18} className="animate-spin" />
                  {t('seller.onboarding.saving')}
                </>
              ) : (
                <>
                  {t('seller.onboarding.saveAndContinue')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isCurrentStepValid() || submitting}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                isCurrentStepValid() && !submitting
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : `${styles.bgSecondary} ${styles.textMuted} cursor-not-allowed`
              }`}
            >
              {submitting ? (
                <>
                  <Spinner size={18} className="animate-spin" />
                  {t('seller.onboarding.submitting')}
                </>
              ) : (
                <>
                  <Check size={18} weight="bold" />
                  {t('seller.onboarding.submit')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOnboarding;
