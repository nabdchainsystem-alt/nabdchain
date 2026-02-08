import React, { useState, useEffect, useCallback } from 'react';
import { BuyerPortalPage } from './buyer/BuyerPortalPage';
import { SellerPortalPage } from './seller/SellerPortalPage';
import { AdminPortalPage } from './admin/AdminPortalPage';
import { PortalLoginModal } from '../auth/PortalLoginModal';
import { PortalSignupModal } from '../auth/PortalSignupModal';
import { portalAuthService, SessionEventType } from './services/portalAuthService';
import { ShoppingCart, Storefront, SignIn, UserPlus, Warning, CircleNotch, X } from 'phosphor-react';

type PortalType = 'buyer' | 'seller' | 'admin' | null;

interface PortalMarketplacePageProps {
  portalType: PortalType;
  onLogout: () => void;
}

export const PortalMarketplacePage: React.FC<PortalMarketplacePageProps> = ({
  portalType: initialPortalType,
  onLogout,
}) => {
  const [portalType, setPortalType] = useState<PortalType>(initialPortalType);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'buyer' | 'seller'>('buyer');
  const [isValidating, setIsValidating] = useState(true);
  const [sessionError, setSessionError] = useState<{ type: SessionEventType; message: string } | null>(null);

  // Check if user has tokens in storage (not validated yet)
  const hasStoredAuth =
    portalAuthService.isAuthenticated() ||
    (localStorage.getItem('mock_auth_token') && localStorage.getItem('nabd_dev_mode') === 'true');

  // Track if session is validated
  const [isSessionValid, setIsSessionValid] = useState(false);

  // Handle session events (expiry, suspension, etc.)
  const handleSessionEvent = useCallback((event: SessionEventType, message: string) => {
    setSessionError({ type: event, message });
    setIsSessionValid(false);
    if (event === 'session_expired' || event === 'session_invalid') {
      // Clear auth and show login
      portalAuthService.clearAuthTokens();
      setPortalType(null);
    }
  }, []);

  // Dismiss session error
  const dismissSessionError = () => {
    setSessionError(null);
  };

  // Validate session on mount
  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      // If no stored auth, skip validation
      if (!hasStoredAuth) {
        if (mounted) {
          setIsValidating(false);
          setIsSessionValid(false);
        }
        return;
      }

      try {
        const result = await portalAuthService.validateSession();

        if (!mounted) return;

        if (result.success && result.user) {
          setIsSessionValid(true);
          // Update portal type from validated session
          if (result.user.portalRole === 'admin') {
            setPortalType('admin');
            localStorage.setItem('portal_type', 'admin');
          } else if (result.user.portalRole === 'seller' && result.seller) {
            // Check if seller needs onboarding
            if (result.seller.status === 'incomplete') {
              localStorage.setItem('seller_status', 'incomplete');
            } else {
              localStorage.removeItem('seller_status');
            }
          }
        } else {
          // Session validation failed
          setIsSessionValid(false);
          if (result.error?.code === 'TOKEN_EXPIRED') {
            setSessionError({ type: 'session_expired', message: 'Your session has expired. Please log in again.' });
            portalAuthService.clearAuthTokens();
            setPortalType(null);
          }
        }
      } catch (error) {
        if (mounted) {
          // Network error - allow offline access with warning if token looks valid
          console.warn('[PortalAuth] Session validation failed:', error);
          // If we have a token that's not expired, cautiously allow access
          if (hasStoredAuth && !portalAuthService.isTokenExpired()) {
            setIsSessionValid(true);
          } else {
            setIsSessionValid(false);
          }
        }
      } finally {
        if (mounted) {
          setIsValidating(false);
        }
      }
    };

    validateSession();

    // Subscribe to session events
    const unsubscribe = portalAuthService.onSessionEvent(handleSessionEvent);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [hasStoredAuth, handleSessionEvent]);

  // Sync portal type from storage on mount
  useEffect(() => {
    if (!portalType) {
      const stored = localStorage.getItem('portal_type') as PortalType;
      if (stored === 'buyer' || stored === 'seller' || stored === 'admin') {
        setPortalType(stored);
      }
    }
  }, [portalType]);

  // Combined authentication check
  const isAuthenticated = hasStoredAuth && isSessionValid;

  const handleSelectPortal = (type: 'buyer' | 'seller') => {
    setSelectedTab(type);
    // If authenticated, set portal type directly
    if (isAuthenticated) {
      localStorage.setItem('portal_type', type);
      setPortalType(type);
    } else {
      // If not authenticated, show login modal
      setIsLoginOpen(true);
    }
  };

  const handleOpenSignup = (type: 'buyer' | 'seller') => {
    setSelectedTab(type);
    setIsSignupOpen(true);
  };

  const handleOpenLogin = (type: 'buyer' | 'seller') => {
    setSelectedTab(type);
    setIsLoginOpen(true);
  };

  const handleSwitchToSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const handleRoleSwitch = () => {
    const newType = portalType === 'buyer' ? 'seller' : 'buyer';
    localStorage.setItem('portal_type', newType);
    setPortalType(newType);
  };

  // Show loading spinner while validating session
  if (isValidating && hasStoredAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <CircleNotch size={40} className="animate-spin text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Validating session...</p>
        </div>
      </div>
    );
  }

  // Session error banner component
  const SessionErrorBanner = () => {
    if (!sessionError) return null;

    const bgColor =
      sessionError.type === 'account_suspended'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : sessionError.type === 'service_unavailable'
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';

    const textColor =
      sessionError.type === 'account_suspended'
        ? 'text-red-700 dark:text-red-300'
        : sessionError.type === 'service_unavailable'
          ? 'text-yellow-700 dark:text-yellow-300'
          : 'text-amber-700 dark:text-amber-300';

    return (
      <div className={`fixed top-0 left-0 right-0 z-50 ${bgColor} border-b px-4 py-3`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warning size={20} className={textColor} weight="fill" />
            <span className={`text-sm font-medium ${textColor}`}>{sessionError.message}</span>
          </div>
          <button
            onClick={dismissSessionError}
            className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 ${textColor}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  };

  // If authenticated and portal type is set, show the appropriate portal
  if (isAuthenticated && portalType === 'buyer') {
    return (
      <>
        <SessionErrorBanner />
        <BuyerPortalPage onLogout={onLogout} onRoleSwitch={handleRoleSwitch} />
      </>
    );
  }

  if (isAuthenticated && portalType === 'seller') {
    return (
      <>
        <SessionErrorBanner />
        <SellerPortalPage onLogout={onLogout} onRoleSwitch={handleRoleSwitch} />
      </>
    );
  }

  if (isAuthenticated && portalType === 'admin') {
    return (
      <>
        <SessionErrorBanner />
        <AdminPortalPage onLogout={onLogout} onRoleSwitch={handleRoleSwitch} />
      </>
    );
  }

  // Show portal selection / login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <SessionErrorBanner />

      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black font-bold">
              N
            </div>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">NABD Marketplace</span>
          </div>
          {isAuthenticated && (
            <button onClick={onLogout} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">Welcome to NABD Marketplace</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {isAuthenticated
              ? "Choose how you'd like to use the marketplace"
              : 'Sign in or create an account to get started'}
          </p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Buyer Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
              <ShoppingCart size={28} className="text-blue-600 dark:text-blue-400" weight="fill" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">I'm a Buyer</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Browse products, create RFQs, manage orders and track purchases from suppliers.
            </p>

            {isAuthenticated ? (
              <button
                onClick={() => handleSelectPortal('buyer')}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Enter Buyer Portal
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleOpenLogin('buyer')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <SignIn size={18} />
                  Sign In as Buyer
                </button>
                <button
                  onClick={() => handleOpenSignup('buyer')}
                  className="w-full h-11 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  Create Buyer Account
                </button>
              </div>
            )}
          </div>

          {/* Seller Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6">
              <Storefront size={28} className="text-emerald-600 dark:text-emerald-400" weight="fill" />
            </div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">I'm a Seller</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              List products, respond to RFQs, manage inventory and process customer orders.
            </p>

            {isAuthenticated ? (
              <button
                onClick={() => handleSelectPortal('seller')}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Storefront size={18} />
                Enter Seller Portal
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleOpenLogin('seller')}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <SignIn size={18} />
                  Sign In as Seller
                </button>
                <button
                  onClick={() => handleOpenSignup('seller')}
                  className="w-full h-11 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  Become a Seller
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Demo Credentials Note (dev only) */}
        {import.meta.env.VITE_USE_MOCK_AUTH === 'true' && (
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <p className="font-medium mb-1">Demo Credentials</p>
            <p>Buyer: buy@nabdchain.com / 2450</p>
            <p>Seller: sell@nabdchain.com / 2450</p>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <PortalLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        defaultTab={selectedTab}
        onSwitchToSignup={handleSwitchToSignup}
      />

      {/* Signup Modal */}
      <PortalSignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        defaultTab={selectedTab}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default PortalMarketplacePage;
