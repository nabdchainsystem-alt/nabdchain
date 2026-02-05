import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeSlash, Spinner, ShoppingCart, Storefront, CheckCircle, WarningCircle } from 'phosphor-react';
import { portalAuthService, BuyerSignupData, SellerSignupData } from '../portal/services/portalAuthService';

type PortalType = 'buyer' | 'seller';

interface PortalSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  defaultTab?: PortalType;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const PortalSignupModal: React.FC<PortalSignupModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  defaultTab = 'buyer',
}) => {
  const [activeTab, setActiveTab] = useState<PortalType>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Buyer form fields
  const [buyerData, setBuyerData] = useState<BuyerSignupData>({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    phoneNumber: '',
    country: '',
    city: '',
  });

  // Seller form fields
  const [sellerData, setSellerData] = useState<SellerSignupData>({
    fullName: '',
    email: '',
    password: '',
    displayName: '',
  });

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: '', color: '' });

  // Email availability check
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Reset form when modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setBuyerData({ fullName: '', email: '', password: '', companyName: '', phoneNumber: '', country: '', city: '' });
      setSellerData({ fullName: '', email: '', password: '', displayName: '' });
      setError('');
      setPasswordStrength({ score: 0, label: '', color: '' });
      setEmailAvailable(null);
    }
  }, [isOpen, defaultTab]);

  // Calculate password strength
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const levels: PasswordStrength[] = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: 'bg-red-500' },
      { score: 2, label: 'Fair', color: 'bg-orange-500' },
      { score: 3, label: 'Good', color: 'bg-yellow-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[score];
  };

  // Check email availability with debounce
  useEffect(() => {
    const email = activeTab === 'buyer' ? buyerData.email : sellerData.email;
    if (!email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const result = await portalAuthService.checkEmail(email);
        setEmailAvailable(result.available);
      } catch {
        setEmailAvailable(null);
      }
      setCheckingEmail(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [buyerData.email, sellerData.email, activeTab]);

  // Handle password change
  const handlePasswordChange = (password: string) => {
    if (activeTab === 'buyer') {
      setBuyerData(prev => ({ ...prev, password }));
    } else {
      setSellerData(prev => ({ ...prev, password }));
    }
    setPasswordStrength(calculatePasswordStrength(password));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (activeTab === 'buyer') {
        result = await portalAuthService.signupBuyer(buyerData);
      } else {
        result = await portalAuthService.signupSeller(sellerData);
      }

      if (!result.success) {
        setError(result.error?.message || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Store auth tokens and portal type
      if (result.accessToken && result.refreshToken && result.user) {
        portalAuthService.storeAuthTokens(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          activeTab,
          result.user.id
        );
      }

      // Set seller status for onboarding redirect
      if (activeTab === 'seller' && result.seller?.status === 'incomplete') {
        localStorage.setItem('seller_status', 'incomplete');
      }

      // Reload page to show portal (routes are internal, not URL-based)
      window.location.reload();
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const currentPassword = activeTab === 'buyer' ? buyerData.password : sellerData.password;
  const isFormValid = activeTab === 'buyer'
    ? buyerData.fullName && buyerData.email && buyerData.password && buyerData.companyName && passwordStrength.score >= 4
    : sellerData.fullName && sellerData.email && sellerData.password && sellerData.displayName && passwordStrength.score >= 4;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-colors"
          >
            {/* Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 w-full max-w-[480px] rounded-xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),0_4px_8px_-4px_rgba(0,0,0,0.1)] overflow-hidden relative border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-colors focus:outline-none z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 pb-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black text-lg font-bold mx-auto mb-4">
                    {activeTab === 'buyer' ? <ShoppingCart size={20} weight="fill" /> : <Storefront size={20} weight="fill" />}
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
                    {activeTab === 'buyer' ? 'Create Buyer Account' : 'Become a Seller'}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {activeTab === 'buyer'
                      ? 'Start sourcing products from verified suppliers'
                      : 'List your products and reach new customers'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                      <WarningCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Full Name *</label>
                    <input
                      type="text"
                      value={activeTab === 'buyer' ? buyerData.fullName : sellerData.fullName}
                      onChange={e => {
                        if (activeTab === 'buyer') {
                          setBuyerData(prev => ({ ...prev, fullName: e.target.value }));
                        } else {
                          setSellerData(prev => ({ ...prev, fullName: e.target.value }));
                        }
                      }}
                      className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Work Email *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={activeTab === 'buyer' ? buyerData.email : sellerData.email}
                        onChange={e => {
                          if (activeTab === 'buyer') {
                            setBuyerData(prev => ({ ...prev, email: e.target.value }));
                          } else {
                            setSellerData(prev => ({ ...prev, email: e.target.value }));
                          }
                        }}
                        className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 pr-10 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                        placeholder="you@company.com"
                      />
                      {checkingEmail && (
                        <Spinner className="absolute right-3 top-3 animate-spin text-zinc-400" size={16} />
                      )}
                      {!checkingEmail && emailAvailable === true && (
                        <CheckCircle className="absolute right-3 top-3 text-green-500" size={16} weight="fill" />
                      )}
                      {!checkingEmail && emailAvailable === false && (
                        <WarningCircle className="absolute right-3 top-3 text-red-500" size={16} weight="fill" />
                      )}
                    </div>
                    {emailAvailable === false && (
                      <p className="text-xs text-red-500">This email is already registered</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => handlePasswordChange(e.target.value)}
                        className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 pr-10 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {currentPassword && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-zinc-200 dark:bg-zinc-700'}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {passwordStrength.label}
                          {passwordStrength.score < 4 && ' - Use 8+ chars, upper/lowercase, number, symbol'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Company Name (Buyer) or Display Name (Seller) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {activeTab === 'buyer' ? 'Company Name *' : 'Store Display Name *'}
                    </label>
                    <input
                      type="text"
                      value={activeTab === 'buyer' ? buyerData.companyName : sellerData.displayName}
                      onChange={e => {
                        if (activeTab === 'buyer') {
                          setBuyerData(prev => ({ ...prev, companyName: e.target.value }));
                        } else {
                          setSellerData(prev => ({ ...prev, displayName: e.target.value }));
                        }
                      }}
                      className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                      placeholder={activeTab === 'buyer' ? 'Your company name' : 'How customers will see your store'}
                    />
                  </div>

                  {/* Buyer-only optional fields */}
                  {activeTab === 'buyer' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Phone Number <span className="text-zinc-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={buyerData.phoneNumber}
                          onChange={e => setBuyerData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                          placeholder="+966 5XX XXX XXXX"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Country <span className="text-zinc-400 font-normal">(opt)</span>
                          </label>
                          <select
                            value={buyerData.country}
                            onChange={e => setBuyerData(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                          >
                            <option value="">Select</option>
                            <option value="SA">Saudi Arabia</option>
                            <option value="AE">UAE</option>
                            <option value="KW">Kuwait</option>
                            <option value="BH">Bahrain</option>
                            <option value="QA">Qatar</option>
                            <option value="OM">Oman</option>
                            <option value="EG">Egypt</option>
                            <option value="JO">Jordan</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            City <span className="text-zinc-400 font-normal">(opt)</span>
                          </label>
                          <input
                            type="text"
                            value={buyerData.city}
                            onChange={e => setBuyerData(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                            placeholder="City"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !isFormValid || emailAvailable === false}
                    className="w-full h-11 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Spinner className="animate-spin" size={18} />
                    ) : (
                      <>
                        {activeTab === 'buyer' ? <ShoppingCart size={18} /> : <Storefront size={18} />}
                        {activeTab === 'buyer' ? 'Create Buyer Account' : 'Continue to Setup'}
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Footer */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 p-4 text-center">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-black dark:text-white hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PortalSignupModal;
