/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  User,
  Buildings,
  MapPin,
  Bank,
  Phone,
  ShieldCheck,
  Check,
  X,
  Warning,
  Clock,
  Upload,
  Image,
  FileText,
  Eye,
  Spinner,
  FloppyDisk,
  CloudArrowUp,
  CheckCircle,
  XCircle,
  FilePdf,
  FileImage,
} from 'phosphor-react';
import { Container, PageHeader, Select, PortalDatePicker } from '../../components';
import { usePortal } from '../../context/PortalContext';
import { useAuth } from '../../../../auth-adapter';
import {
  sellerSettingsService,
  SellerProfile,
  SellerProfileInput,
  SellerCompanyInput,
  SellerAddressInput,
  SellerBankInput,
  SellerContactInput,
  VerificationStatus,
} from '../../services/sellerSettingsService';

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

// =============================================================================
// Component
// =============================================================================

export const SellerSettings: React.FC = () => {
  const { styles, t, direction } = usePortal();
  const { getToken } = useAuth();
  const isRTL = direction === 'rtl';

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [_expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    company: true,
    address: true,
    bank: true,
    contact: true,
    verification: true,
  });

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form States
  const [profileForm, setProfileForm] = useState<SellerProfileInput>({
    displayName: '',
    slug: '',
    shortDescription: '',
    logoUrl: '',
    coverUrl: '',
  });

  const [companyForm, setCompanyForm] = useState<SellerCompanyInput>({
    legalName: '',
    crNumber: '',
    vatNumber: '',
    vatDocumentUrl: '',
    companyType: '',
    dateOfEstablishment: '',
  });

  const [addressForm, setAddressForm] = useState<SellerAddressInput>({
    country: 'SA',
    city: '',
    district: '',
    street: '',
    buildingNumber: '',
    postalCode: '',
    additionalInfo: '',
  });

  const [bankForm, setBankForm] = useState<SellerBankInput>({
    bankName: '',
    accountHolderName: '',
    iban: '',
    currency: 'SAR',
    bankCountry: 'SA',
  });

  const [contactForm, setContactForm] = useState<SellerContactInput>({
    businessEmail: '',
    phoneNumber: '',
    whatsapp: '',
    supportContactName: '',
  });

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const [profileData, verificationData] = await Promise.all([
        sellerSettingsService.getProfile(token),
        sellerSettingsService.getVerificationStatus(token),
      ]);

      setProfile(profileData);
      setVerification(verificationData);

      // Populate forms
      setProfileForm({
        displayName: profileData.displayName || '',
        slug: profileData.slug || '',
        shortDescription: profileData.shortDescription || '',
        logoUrl: profileData.logoUrl || '',
        coverUrl: profileData.coverUrl || '',
      });

      if (profileData.company) {
        setCompanyForm({
          legalName: profileData.company.legalName || '',
          crNumber: profileData.company.crNumber || '',
          vatNumber: profileData.company.vatNumber || '',
          vatDocumentUrl: profileData.company.vatDocumentUrl || '',
          companyType: profileData.company.companyType || '',
          dateOfEstablishment: profileData.company.dateOfEstablishment?.split('T')[0] || '',
        });
      }

      if (profileData.address) {
        setAddressForm({
          country: profileData.address.country || 'SA',
          city: profileData.address.city || '',
          district: profileData.address.district || '',
          street: profileData.address.street || '',
          buildingNumber: profileData.address.buildingNumber || '',
          postalCode: profileData.address.postalCode || '',
          additionalInfo: profileData.address.additionalInfo || '',
        });
      }

      if (profileData.bank) {
        setBankForm({
          bankName: profileData.bank.bankName || '',
          accountHolderName: profileData.bank.accountHolderName || '',
          iban: profileData.bank.iban || '',
          currency: profileData.bank.currency || 'SAR',
          bankCountry: profileData.bank.bankCountry || 'SA',
        });
      }

      if (profileData.contact) {
        setContactForm({
          businessEmail: profileData.contact.businessEmail || '',
          phoneNumber: profileData.contact.phoneNumber || '',
          whatsapp: profileData.contact.whatsapp || '',
          supportContactName: profileData.contact.supportContactName || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Calculate completion progress
  const completionProgress = useMemo(() => {
    const steps = [
      // Profile section (20%)
      { filled: !!profileForm.displayName, weight: 10 },
      { filled: !!profileForm.slug, weight: 5 },
      { filled: !!profileForm.logoUrl, weight: 5 },
      // Company section (25%)
      { filled: !!companyForm.legalName, weight: 10 },
      { filled: !!companyForm.crNumber, weight: 8 },
      { filled: !!companyForm.vatNumber, weight: 7 },
      // Address section (15%)
      { filled: !!addressForm.city, weight: 8 },
      { filled: !!addressForm.street, weight: 4 },
      { filled: !!addressForm.postalCode, weight: 3 },
      // Bank section (25%)
      { filled: !!bankForm.bankName, weight: 8 },
      { filled: !!bankForm.accountHolderName, weight: 8 },
      { filled: !!bankForm.iban && !bankForm.iban.includes('*'), weight: 9 },
      // Contact section (15%)
      { filled: !!contactForm.businessEmail, weight: 8 },
      { filled: !!contactForm.phoneNumber, weight: 7 },
    ];

    const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0);
    const filledWeight = steps.reduce((sum, step) => sum + (step.filled ? step.weight : 0), 0);

    return Math.round((filledWeight / totalWeight) * 100);
  }, [profileForm, companyForm, addressForm, bankForm, contactForm]);

  // Auto-save effect
  useEffect(() => {
    if (hasChanges && !saving) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save (3 seconds debounce)
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          setAutoSaving(true);
          const token = await getToken();
          if (!token) return;

          // Save profile if displayName is set
          if (profileForm.displayName) {
            await sellerSettingsService.updateProfile(token, profileForm);
          }

          // Save company if legalName is set
          if (companyForm.legalName) {
            await sellerSettingsService.updateCompany(token, companyForm);
          }

          // Save address if city is set
          if (addressForm.city) {
            await sellerSettingsService.updateAddress(token, addressForm);
          }

          // Save bank if all required fields are set and IBAN is not masked
          if (bankForm.bankName && bankForm.accountHolderName && bankForm.iban && !bankForm.iban.includes('*')) {
            await sellerSettingsService.updateBank(token, bankForm);
          }

          // Save contact if required fields are set
          if (contactForm.businessEmail && contactForm.phoneNumber) {
            await sellerSettingsService.updateContact(token, contactForm);
          }

          setLastSaved(new Date());
          setHasChanges(false);
        } catch (err) {
          console.error('Auto-save failed:', err);
        } finally {
          setAutoSaving(false);
        }
      }, 3000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, saving, profileForm, companyForm, addressForm, bankForm, contactForm, getToken]);

  // Toggle section expansion
  const _toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Save all changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      // Save profile
      if (profileForm.displayName) {
        await sellerSettingsService.updateProfile(token, profileForm);
      }

      // Save company
      if (companyForm.legalName) {
        await sellerSettingsService.updateCompany(token, companyForm);
      }

      // Save address
      if (addressForm.city) {
        await sellerSettingsService.updateAddress(token, addressForm);
      }

      // Save bank
      if (bankForm.bankName && bankForm.accountHolderName && bankForm.iban && !bankForm.iban.includes('*')) {
        await sellerSettingsService.updateBank(token, bankForm);
      }

      // Save contact
      if (contactForm.businessEmail && contactForm.phoneNumber) {
        await sellerSettingsService.updateContact(token, contactForm);
      }

      setSuccessMessage(t('seller.settings.saveSuccess') || 'Settings saved successfully');
      setHasChanges(false);

      // Refresh data
      await fetchProfile();
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Generate slug from display name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: styles.bgPrimary }}>
        <Spinner size={32} className="animate-spin" style={{ color: styles.info }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: styles.bgPrimary }}>
      <Container variant="full">
        <PageHeader
          title={t('seller.settings.title') || 'Seller Settings'}
          subtitle={t('seller.settings.subtitle') || 'Manage your seller profile and business information'}
          actions={
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              {autoSaving && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: styles.textMuted }}>
                  <CloudArrowUp size={14} className="animate-pulse" />
                  {t('seller.settings.autoSaving') || 'Saving...'}
                </span>
              )}
              {lastSaved && !autoSaving && !hasChanges && (
                <span className="flex items-center gap-1.5 text-xs" style={{ color: styles.success }}>
                  <CheckCircle size={14} />
                  {t('seller.settings.saved') || 'Saved'}
                </span>
              )}
              {hasChanges && !autoSaving && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: styles.info, color: '#fff' }}
                >
                  {saving ? <Spinner size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
                  {t('seller.settings.saveChanges') || 'Save Changes'}
                </button>
              )}
            </div>
          }
        />

        {/* Progress Indicator */}
        <div
          className="mb-6 p-4 rounded-xl border"
          style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} style={{ color: completionProgress === 100 ? styles.success : styles.info }} />
              <span className="font-medium" style={{ color: styles.textPrimary }}>
                {t('seller.settings.profileCompletion') || 'Profile Completion'}
              </span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: completionProgress === 100 ? styles.success : styles.info }}
            >
              {completionProgress}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: styles.bgSecondary }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionProgress}%`,
                backgroundColor:
                  completionProgress === 100
                    ? styles.success
                    : completionProgress >= 70
                      ? styles.info
                      : completionProgress >= 40
                        ? '#f59e0b'
                        : styles.error,
              }}
            />
          </div>
          {completionProgress < 100 && (
            <p className="text-xs mt-2" style={{ color: styles.textMuted }}>
              {t('seller.settings.completeProfileHint') || 'Complete your profile to start selling on the marketplace'}
            </p>
          )}
          {completionProgress === 100 && !verification?.canPublish && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#f59e0b' }}>
              <Clock size={12} />
              {t('seller.settings.pendingVerification') || 'Awaiting verification approval'}
            </p>
          )}
          {verification?.canPublish && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: styles.success }}>
              <CheckCircle size={12} />
              {t('seller.settings.readyToSell') || 'Your account is ready to sell!'}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: `1px solid ${styles.error}` }}
          >
            <Warning size={20} style={{ color: styles.error }} />
            <span style={{ color: styles.error }}>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: `1px solid ${styles.success}` }}
          >
            <Check size={20} style={{ color: styles.success }} />
            <span style={{ color: styles.success }}>{successMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Seller Profile */}
          <SettingsSection
            icon={User}
            title={t('seller.settings.profile.title') || 'Seller Profile'}
            subtitle={t('seller.settings.profile.subtitle') || 'This appears on your public seller page'}
            styles={styles}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('seller.settings.profile.displayName') || 'Seller Display Name'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={profileForm.displayName}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, displayName: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="Your Store Name"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.profile.slug') || 'Username / Slug'}
                hint="marketplace.com/seller/your-slug"
                styles={styles}
                isRTL={isRTL}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileForm.slug}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, slug: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="your-store-name"
                    className="flex-1 px-4 py-2.5 rounded-lg border text-sm"
                    style={{
                      backgroundColor: styles.bgCard,
                      borderColor: styles.border,
                      color: styles.textPrimary,
                      direction: 'ltr',
                    }}
                  />
                  <button
                    onClick={() => setProfileForm({ ...profileForm, slug: generateSlug(profileForm.displayName) })}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => {
                      if (profileForm.slug) {
                        window.open(`/seller/${profileForm.slug}`, '_blank');
                      }
                    }}
                    disabled={!profileForm.slug}
                    className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: profileForm.slug ? styles.info : styles.bgSecondary,
                      color: profileForm.slug ? '#fff' : styles.textMuted,
                      opacity: profileForm.slug ? 1 : 0.5,
                    }}
                    title={t('seller.settings.profile.previewProfile') || 'Preview public profile'}
                  >
                    <Eye size={14} />
                    {t('seller.settings.profile.preview') || 'Preview'}
                  </button>
                </div>
              </FormField>

              <FormField
                label={t('seller.settings.profile.description') || 'Short Description'}
                hint="Max 160 characters"
                className="md:col-span-2"
                styles={styles}
                isRTL={isRTL}
              >
                <textarea
                  value={profileForm.shortDescription}
                  onChange={(e) => {
                    if (e.target.value.length <= 160) {
                      setProfileForm({ ...profileForm, shortDescription: e.target.value });
                      setHasChanges(true);
                    }
                  }}
                  placeholder="Tell buyers about your business..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm resize-none"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
                <div className="text-xs mt-1" style={{ color: styles.textMuted }}>
                  {profileForm.shortDescription?.length || 0}/160
                </div>
              </FormField>

              <FormField
                label={t('seller.settings.profile.logo') || 'Logo'}
                hint="Square, 1:1 ratio recommended"
                styles={styles}
                isRTL={isRTL}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: styles.bgSecondary }}
                  >
                    {profileForm.logoUrl ? (
                      <img src={profileForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} style={{ color: styles.textMuted }} />
                    )}
                  </div>
                  <input
                    type="text"
                    value={profileForm.logoUrl}
                    onChange={(e) => {
                      setProfileForm({ ...profileForm, logoUrl: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 rounded-lg border text-sm"
                    style={{
                      backgroundColor: styles.bgCard,
                      borderColor: styles.border,
                      color: styles.textPrimary,
                      direction: 'ltr',
                    }}
                  />
                </div>
              </FormField>

              <FormField
                label={t('seller.settings.profile.cover') || 'Cover Image'}
                hint="Wide, 16:9 ratio recommended"
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={profileForm.coverUrl}
                  onChange={(e) => {
                    setProfileForm({ ...profileForm, coverUrl: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>
            </div>

            {/* Live Preview Card */}
            {profileForm.displayName && (
              <div className="mt-6">
                <p className="text-xs font-medium mb-2" style={{ color: styles.textMuted }}>
                  {t('seller.settings.profile.preview') || 'Preview'}
                </p>
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: styles.border, maxWidth: '320px' }}
                >
                  <div
                    className="h-20 relative"
                    style={{
                      backgroundColor: styles.bgSecondary,
                      backgroundImage: profileForm.coverUrl ? `url(${profileForm.coverUrl})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div
                      className="absolute -bottom-6 left-4 w-12 h-12 rounded-lg border-2 flex items-center justify-center overflow-hidden"
                      style={{
                        backgroundColor: styles.bgCard,
                        borderColor: styles.bgCard,
                      }}
                    >
                      {profileForm.logoUrl ? (
                        <img src={profileForm.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} style={{ color: styles.textMuted }} />
                      )}
                    </div>
                  </div>
                  <div className="pt-8 pb-4 px-4" style={{ backgroundColor: styles.bgCard }}>
                    <h4 className="font-medium text-sm" style={{ color: styles.textPrimary }}>
                      {profileForm.displayName}
                    </h4>
                    <p className="text-xs" style={{ color: styles.textMuted }}>
                      @{profileForm.slug || 'your-slug'}
                    </p>
                    {profileForm.shortDescription && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: styles.textSecondary }}>
                        {profileForm.shortDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SettingsSection>

          {/* Section 2: Company Legal Information */}
          <SettingsSection
            icon={Buildings}
            title={t('seller.settings.company.title') || 'Company Legal Information'}
            subtitle={t('seller.settings.company.subtitle') || 'Required for compliance and verification'}
            styles={styles}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('seller.settings.company.legalName') || 'Legal Company Name'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={companyForm.legalName}
                  onChange={(e) => {
                    setCompanyForm({ ...companyForm, legalName: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="ABC Trading Company LLC"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>

              <FormField label={t('seller.settings.company.type') || 'Company Type'} styles={styles} isRTL={isRTL}>
                <Select
                  value={companyForm.companyType}
                  onChange={(value) => {
                    setCompanyForm({ ...companyForm, companyType: value });
                    setHasChanges(true);
                  }}
                  placeholder={t('common.selectType') || 'Select type...'}
                  options={COMPANY_TYPES.map((type) => ({
                    value: type.value,
                    label: type.label,
                  }))}
                  className="w-full"
                />
              </FormField>

              <FormField
                label={t('seller.settings.company.crNumber') || 'Commercial Registration Number'}
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={companyForm.crNumber}
                  onChange={(e) => {
                    setCompanyForm({ ...companyForm, crNumber: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="1010XXXXXX"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.company.vatNumber') || 'VAT Certificate Number'}
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={companyForm.vatNumber}
                  onChange={(e) => {
                    setCompanyForm({ ...companyForm, vatNumber: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="3XXXXXXXXXX0003"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.company.vatDocument') || 'VAT Certificate Upload'}
                hint="PDF or Image"
                styles={styles}
                isRTL={isRTL}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={companyForm.vatDocumentUrl}
                    onChange={(e) => {
                      setCompanyForm({ ...companyForm, vatDocumentUrl: e.target.value });
                      setHasChanges(true);
                    }}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2.5 rounded-lg border text-sm"
                    style={{
                      backgroundColor: styles.bgCard,
                      borderColor: styles.border,
                      color: styles.textPrimary,
                      direction: 'ltr',
                    }}
                  />
                  <button
                    className="p-2.5 rounded-lg border"
                    style={{ borderColor: styles.border, backgroundColor: styles.bgCard }}
                  >
                    <Upload size={18} style={{ color: styles.textSecondary }} />
                  </button>
                </div>
              </FormField>

              <FormField
                label={t('seller.settings.company.established') || 'Date of Establishment'}
                styles={styles}
                isRTL={isRTL}
              >
                <PortalDatePicker
                  value={companyForm.dateOfEstablishment}
                  onChange={(value) => {
                    setCompanyForm({ ...companyForm, dateOfEstablishment: value });
                    setHasChanges(true);
                  }}
                  className="w-full"
                />
              </FormField>
            </div>
          </SettingsSection>

          {/* Section 3: National Address */}
          <SettingsSection
            icon={MapPin}
            title={t('seller.settings.address.title') || 'National Address'}
            subtitle={t('seller.settings.address.subtitle') || 'Your business location'}
            styles={styles}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                label={t('seller.settings.address.country') || 'Country'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <Select
                  value={addressForm.country}
                  onChange={(value) => {
                    setAddressForm({ ...addressForm, country: value });
                    setHasChanges(true);
                  }}
                  options={COUNTRIES.map((country) => ({
                    value: country.code,
                    label: country.name,
                  }))}
                  className="w-full"
                />
              </FormField>

              <FormField label={t('seller.settings.address.city') || 'City'} required styles={styles} isRTL={isRTL}>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, city: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="Riyadh"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>

              <FormField label={t('seller.settings.address.district') || 'District'} styles={styles} isRTL={isRTL}>
                <input
                  type="text"
                  value={addressForm.district}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, district: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="Al Olaya"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>

              <FormField label={t('seller.settings.address.street') || 'Street'} styles={styles} isRTL={isRTL}>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, street: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="King Fahd Road"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.address.building') || 'Building Number'}
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={addressForm.buildingNumber}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, buildingNumber: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="1234"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField label={t('seller.settings.address.postalCode') || 'Postal Code'} styles={styles} isRTL={isRTL}>
                <input
                  type="text"
                  value={addressForm.postalCode}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, postalCode: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="12345"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.address.additional') || 'Additional Info'}
                className="md:col-span-2 lg:col-span-3"
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={addressForm.additionalInfo}
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, additionalInfo: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="Floor, unit, landmark..."
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>
            </div>
          </SettingsSection>

          {/* Section 4: Banking & Payout */}
          <SettingsSection
            icon={Bank}
            title={t('seller.settings.bank.title') || 'Banking & Payout Information'}
            subtitle={t('seller.settings.bank.subtitle') || 'For receiving payments from sales'}
            styles={styles}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('seller.settings.bank.bankName') || 'Bank Name'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <Select
                  value={bankForm.bankName}
                  onChange={(value) => {
                    setBankForm({ ...bankForm, bankName: value });
                    setHasChanges(true);
                  }}
                  placeholder={t('common.selectBank') || 'Select bank...'}
                  options={SAUDI_BANKS.map((bank) => ({
                    value: bank,
                    label: bank,
                  }))}
                  className="w-full"
                />
              </FormField>

              <FormField
                label={t('seller.settings.bank.accountHolder') || 'Account Holder Name'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={bankForm.accountHolderName}
                  onChange={(e) => {
                    setBankForm({ ...bankForm, accountHolderName: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="As shown on bank account"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.bank.iban') || 'IBAN'}
                required
                hint={bankForm.iban.includes('*') ? 'Enter new IBAN to update' : undefined}
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={bankForm.iban}
                  onChange={(e) => {
                    setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() });
                    setHasChanges(true);
                  }}
                  placeholder="SA0000000000000000000000"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm font-mono"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField label={t('seller.settings.bank.currency') || 'Currency'} styles={styles} isRTL={isRTL}>
                <Select
                  value={bankForm.currency}
                  onChange={(value) => {
                    setBankForm({ ...bankForm, currency: value });
                    setHasChanges(true);
                  }}
                  options={[
                    { value: 'SAR', label: 'SAR - Saudi Riyal' },
                    { value: 'USD', label: 'USD - US Dollar' },
                    { value: 'EUR', label: 'EUR - Euro' },
                    { value: 'AED', label: 'AED - UAE Dirham' },
                  ]}
                  className="w-full"
                />
              </FormField>
            </div>

            {profile?.bank?.updatedAt && (
              <p className="text-xs mt-4" style={{ color: styles.textMuted }}>
                {t('seller.settings.bank.lastUpdated') || 'Last updated'}:{' '}
                {new Date(profile.bank.updatedAt).toLocaleDateString()}
              </p>
            )}
          </SettingsSection>

          {/* Section 5: Business Contact */}
          <SettingsSection
            icon={Phone}
            title={t('seller.settings.contact.title') || 'Business Contact Information'}
            subtitle={t('seller.settings.contact.subtitle') || 'How buyers can reach you'}
            styles={styles}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t('seller.settings.contact.email') || 'Business Email'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="email"
                  value={contactForm.businessEmail}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, businessEmail: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="sales@company.com"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.contact.phone') || 'Phone Number'}
                required
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="tel"
                  value={contactForm.phoneNumber}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, phoneNumber: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.contact.whatsapp') || 'WhatsApp (Optional)'}
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="tel"
                  value={contactForm.whatsapp}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, whatsapp: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                    direction: 'ltr',
                  }}
                />
              </FormField>

              <FormField
                label={t('seller.settings.contact.supportName') || 'Support Contact Name'}
                styles={styles}
                isRTL={isRTL}
              >
                <input
                  type="text"
                  value={contactForm.supportContactName}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, supportContactName: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgCard,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </FormField>
            </div>
          </SettingsSection>

          {/* Section 6: Verification Status */}
          <SettingsSection
            icon={ShieldCheck}
            title={t('seller.settings.verification.title') || 'Verification Status'}
            subtitle={t('seller.settings.verification.subtitle') || 'Your account verification progress'}
            styles={styles}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <VerificationCard
                title={t('seller.settings.verification.profile') || 'Profile Status'}
                status={verification?.profileStatus || 'incomplete'}
                styles={styles}
              />
              <VerificationCard
                title={t('seller.settings.verification.documents') || 'Documents Status'}
                status={verification?.documentsStatus || 'pending'}
                styles={styles}
              />
              <VerificationCard
                title={t('seller.settings.verification.payout') || 'Payout Status'}
                status={verification?.payoutStatus === 'verified' ? 'approved' : 'pending'}
                styles={styles}
              />
            </div>

            {!verification?.canPublish && (
              <div
                className="mt-4 p-4 rounded-lg flex items-start gap-3"
                style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
              >
                <Warning size={20} style={{ color: '#f59e0b' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                    {t('seller.settings.verification.incomplete') || 'Complete your profile to start selling'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
                    {t('seller.settings.verification.incompleteDesc') ||
                      'You need to complete your company information and verify your bank details before you can publish products.'}
                  </p>
                </div>
              </div>
            )}

            {/* Required Documents */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3" style={{ color: styles.textPrimary }}>
                {t('seller.settings.documents.required') || 'Required Documents'}
              </h4>
              <div className="space-y-3">
                <DocumentUploadRow
                  label={t('seller.settings.documents.crDocument') || 'Commercial Registration'}
                  documentType="cr_document"
                  status={
                    profile?.documents?.find((d) => d.documentType === 'cr_document')?.verificationStatus ||
                    'not_uploaded'
                  }
                  fileName={profile?.documents?.find((d) => d.documentType === 'cr_document')?.fileName}
                  styles={styles}
                  t={t}
                />
                <DocumentUploadRow
                  label={t('seller.settings.documents.vatDocument') || 'VAT Certificate'}
                  documentType="vat_document"
                  status={
                    profile?.documents?.find((d) => d.documentType === 'vat_document')?.verificationStatus ||
                    'not_uploaded'
                  }
                  fileName={profile?.documents?.find((d) => d.documentType === 'vat_document')?.fileName}
                  styles={styles}
                  t={t}
                />
                <DocumentUploadRow
                  label={t('seller.settings.documents.nationalAddress') || 'National Address Proof'}
                  documentType="national_address"
                  status={
                    profile?.documents?.find((d) => d.documentType === 'national_address')?.verificationStatus ||
                    'not_uploaded'
                  }
                  fileName={profile?.documents?.find((d) => d.documentType === 'national_address')?.fileName}
                  styles={styles}
                  t={t}
                />
                <DocumentUploadRow
                  label={t('seller.settings.documents.bankLetter') || 'Bank Account Letter'}
                  documentType="bank_letter"
                  status={
                    profile?.documents?.find((d) => d.documentType === 'bank_letter')?.verificationStatus ||
                    'not_uploaded'
                  }
                  fileName={profile?.documents?.find((d) => d.documentType === 'bank_letter')?.fileName}
                  styles={styles}
                  t={t}
                />
              </div>
            </div>
          </SettingsSection>
        </div>
      </Container>
    </div>
  );
};

// =============================================================================
// Sub-Components
// =============================================================================

interface SettingsSectionProps {
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  styles: any;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ icon: Icon, title, subtitle, styles, children }) => (
  <div className="rounded-lg border p-6" style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}>
    <div className="flex items-start gap-4 mb-6">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: styles.bgSecondary }}
      >
        <Icon size={20} style={{ color: styles.info }} />
      </div>
      <div>
        <h3 className="font-semibold" style={{ color: styles.textPrimary }}>
          {title}
        </h3>
        <p className="text-sm" style={{ color: styles.textMuted }}>
          {subtitle}
        </p>
      </div>
    </div>
    {children}
  </div>
);

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  styles: any;
  isRTL?: boolean;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, hint, className, styles, isRTL, children }) => (
  <div className={className}>
    <label
      className="block text-sm font-medium mb-1.5"
      style={{ color: styles.textPrimary, textAlign: isRTL ? 'right' : 'left' }}
    >
      {label}
      {required && <span style={{ color: styles.error }}> *</span>}
    </label>
    {children}
    {hint && (
      <p className="text-xs mt-1" style={{ color: styles.textMuted }}>
        {hint}
      </p>
    )}
  </div>
);

interface VerificationCardProps {
  title: string;
  status: 'complete' | 'incomplete' | 'pending' | 'approved' | 'rejected';
  styles: any;
}

const VerificationCard: React.FC<VerificationCardProps> = ({ title, status, styles }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'complete':
      case 'approved':
        return {
          icon: Check,
          color: styles.success,
          bgColor: 'rgba(34,197,94,0.1)',
          label: status === 'approved' ? 'Approved' : 'Complete',
        };
      case 'rejected':
        return {
          icon: X,
          color: styles.error,
          bgColor: 'rgba(239,68,68,0.1)',
          label: 'Rejected',
        };
      case 'pending':
        return {
          icon: Clock,
          color: '#f59e0b',
          bgColor: 'rgba(245,158,11,0.1)',
          label: 'Pending',
        };
      default:
        return {
          icon: Warning,
          color: styles.textMuted,
          bgColor: styles.bgSecondary,
          label: 'Incomplete',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: config.bgColor }}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon size={16} style={{ color: config.color }} weight="bold" />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {title}
          </p>
          <p className="text-xs font-medium" style={{ color: config.color }}>
            {config.label}
          </p>
        </div>
      </div>
    </div>
  );
};

// Document Upload Row Component
interface DocumentUploadRowProps {
  label: string;
  documentType: string;
  status: 'pending' | 'approved' | 'rejected' | 'not_uploaded';
  fileName?: string;
  styles: any;
  t: (key: string) => string;
}

const DocumentUploadRow: React.FC<DocumentUploadRowProps> = ({ label, _documentType, status, fileName, styles, t }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: styles.success,
          bgColor: 'rgba(34,197,94,0.1)',
          label: t('seller.settings.documents.approved') || 'Approved',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: styles.error,
          bgColor: 'rgba(239,68,68,0.1)',
          label: t('seller.settings.documents.rejected') || 'Rejected',
        };
      case 'pending':
        return {
          icon: Clock,
          color: '#f59e0b',
          bgColor: 'rgba(245,158,11,0.1)',
          label: t('seller.settings.documents.pending') || 'Under Review',
        };
      default:
        return {
          icon: Upload,
          color: styles.textMuted,
          bgColor: styles.bgSecondary,
          label: t('seller.settings.documents.notUploaded') || 'Not Uploaded',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const getFileIcon = () => {
    if (!fileName) return FileText;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return FilePdf;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return FileImage;
    return FileText;
  };

  const FileIcon = getFileIcon();

  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg border"
      style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.bgColor }}
        >
          {fileName ? (
            <FileIcon size={20} style={{ color: config.color }} />
          ) : (
            <StatusIcon size={20} style={{ color: config.color }} />
          )}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: styles.textPrimary }}>
            {label}
          </p>
          {fileName ? (
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {fileName}
            </p>
          ) : (
            <p className="text-xs" style={{ color: config.color }}>
              {config.label}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Status Badge */}
        {status !== 'not_uploaded' && (
          <span
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: config.bgColor, color: config.color }}
          >
            <StatusIcon size={12} weight="bold" />
            {config.label}
          </span>
        )}

        {/* Upload/Replace Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: status === 'not_uploaded' ? styles.info : styles.bgCard,
            color: status === 'not_uploaded' ? '#fff' : styles.textSecondary,
            border: status === 'not_uploaded' ? 'none' : `1px solid ${styles.border}`,
          }}
        >
          <Upload size={14} />
          {status === 'not_uploaded'
            ? t('seller.settings.documents.upload') || 'Upload'
            : t('seller.settings.documents.replace') || 'Replace'}
        </button>
      </div>
    </div>
  );
};

export default SellerSettings;
