import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeSlash, Spinner, ShoppingCart, Storefront } from 'phosphor-react';

interface PortalLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PortalType = 'buyer' | 'seller';

export const PortalLoginModal: React.FC<PortalLoginModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<PortalType>('buyer');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Portal credentials
    const portalCredentials = {
        buyer: { email: 'buy@nabdchain.com', password: '2450', token: 'buyer-portal-token' },
        seller: { email: 'sell@nabdchain.com', password: '2450', token: 'seller-portal-token' },
    };

    const handleTabChange = (tab: PortalType) => {
        setActiveTab(tab);
        setEmail('');
        setPassword('');
        setError('');
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const expectedCreds = portalCredentials[activeTab];

        if (email === expectedCreds.email && password === expectedCreds.password) {
            localStorage.setItem('nabd_dev_mode', 'true');
            localStorage.setItem('mock_auth_token', expectedCreds.token);
            localStorage.setItem('portal_type', activeTab);

            // Redirect to app subdomain if on main domain
            const hostname = window.location.hostname;
            if (hostname.includes('nabdchain.com') && !hostname.startsWith('app.')) {
                window.location.href = `https://app.nabdchain.com?dev_auth=${expectedCreds.token}&portal=${activeTab}`;
            } else {
                window.location.reload();
            }
        } else {
            setError('Invalid credentials. Please check your email and password.');
            setLoading(false);
        }
    };

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
                            className="bg-white dark:bg-zinc-900 w-full max-w-[420px] rounded-xl shadow-[0_16px_32px_-8px_rgba(0,0,0,0.08),0_4px_8px_-4px_rgba(0,0,0,0.1)] overflow-hidden relative border border-zinc-200 dark:border-zinc-800"
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
                                        N
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Portal Login</h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Access your business portal</p>
                                </div>

                                {/* Tabs */}
                                <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mb-6">
                                    <button
                                        onClick={() => handleTabChange('buyer')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                                            activeTab === 'buyer'
                                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                    >
                                        <ShoppingCart size={18} weight={activeTab === 'buyer' ? 'fill' : 'regular'} />
                                        Buyer
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('seller')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                                            activeTab === 'seller'
                                                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                    >
                                        <Storefront size={18} weight={activeTab === 'seller' ? 'fill' : 'regular'} />
                                        Seller
                                    </button>
                                </div>

                                {/* Tab Description */}
                                <div className="text-center mb-5">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {activeTab === 'buyer'
                                            ? 'Sign in to browse products and manage your orders'
                                            : 'Sign in to manage your store and track sales'}
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                                            <span>•</span> {error}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                                            placeholder={activeTab === 'buyer' ? 'buy@nabdchain.com' : 'sell@nabdchain.com'}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 pr-10 text-sm text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute end-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                            >
                                                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !email || !password}
                                        className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Spinner className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                {activeTab === 'buyer' ? <ShoppingCart size={18} /> : <Storefront size={18} />}
                                                Sign in as {activeTab === 'buyer' ? 'Buyer' : 'Seller'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 p-4 text-center">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Need help? <a href="#" className="text-black dark:text-white hover:underline font-medium">Contact Support</a>
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
