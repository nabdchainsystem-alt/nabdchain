import React, { useState } from 'react';
import { BuyerPortalPage } from './buyer/BuyerPortalPage';
import { SellerPortalPage } from './seller/SellerPortalPage';

interface PortalMarketplacePageProps {
    portalType: 'buyer' | 'seller' | null;
    onLogout: () => void;
}

export const PortalMarketplacePage: React.FC<PortalMarketplacePageProps> = ({ portalType: initialPortalType, onLogout }) => {
    const [portalType, setPortalType] = useState<'buyer' | 'seller' | null>(initialPortalType);

    const handleSelectPortal = (type: 'buyer' | 'seller') => {
        localStorage.setItem('portal_type', type);
        setPortalType(type);
    };

    // Show portal selection if no type selected
    if (!portalType) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Welcome to NABD Marketplace</h1>
                        <p className="text-zinc-600">Choose how you'd like to use the marketplace</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSelectPortal('buyer')}
                            className="p-6 bg-white rounded-xl border-2 border-zinc-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                                <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 mb-2">I'm a Buyer</h3>
                            <p className="text-zinc-600 text-sm">Browse products, create RFQs, manage orders and track purchases from suppliers.</p>
                        </button>

                        <button
                            onClick={() => handleSelectPortal('seller')}
                            className="p-6 bg-white rounded-xl border-2 border-zinc-200 hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                        >
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
                                <svg className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-900 mb-2">I'm a Seller</h3>
                            <p className="text-zinc-600 text-sm">List products, respond to RFQs, manage inventory and process customer orders.</p>
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onLogout}
                            className="text-zinc-500 hover:text-zinc-700 text-sm"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (portalType === 'buyer') {
        return <BuyerPortalPage onLogout={onLogout} />;
    }

    return <SellerPortalPage onLogout={onLogout} />;
};

export default PortalMarketplacePage;
