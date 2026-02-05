import React, { useState, useEffect } from 'react';
import { BuyerPortalPage } from './buyer/BuyerPortalPage';
import { SellerPortalPage } from './seller/SellerPortalPage';
import { PortalLoginModal } from '../auth/PortalLoginModal';
import { PortalSignupModal } from '../auth/PortalSignupModal';
import { portalAuthService } from './services/portalAuthService';
import { ShoppingCart, Storefront, SignIn, UserPlus } from 'phosphor-react';

interface PortalMarketplacePageProps {
    portalType: 'buyer' | 'seller' | null;
    onLogout: () => void;
}

export const PortalMarketplacePage: React.FC<PortalMarketplacePageProps> = ({ portalType: initialPortalType, onLogout }) => {
    const [portalType, setPortalType] = useState<'buyer' | 'seller' | null>(initialPortalType);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isSignupOpen, setIsSignupOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'buyer' | 'seller'>('buyer');

    // Check if user is authenticated via real tokens or mock auth
    const isAuthenticated = portalAuthService.isAuthenticated() ||
        (localStorage.getItem('mock_auth_token') && localStorage.getItem('nabd_dev_mode') === 'true');

    // Sync portal type from storage on mount
    useEffect(() => {
        if (!portalType) {
            const stored = localStorage.getItem('portal_type');
            if (stored === 'buyer' || stored === 'seller') {
                setPortalType(stored);
            }
        }
    }, [portalType]);

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

    // If authenticated and portal type is set, show the appropriate portal
    if (isAuthenticated && portalType === 'buyer') {
        return <BuyerPortalPage onLogout={onLogout} onRoleSwitch={handleRoleSwitch} />;
    }

    if (isAuthenticated && portalType === 'seller') {
        return <SellerPortalPage onLogout={onLogout} onRoleSwitch={handleRoleSwitch} />;
    }

    // Show portal selection / login page
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
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
                        <button
                            onClick={onLogout}
                            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            Sign out
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3">
                        Welcome to NABD Marketplace
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400">
                        {isAuthenticated
                            ? 'Choose how you\'d like to use the marketplace'
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
                        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                            I'm a Buyer
                        </h2>
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
                        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                            I'm a Seller
                        </h2>
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
