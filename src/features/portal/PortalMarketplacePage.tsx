import React from 'react';
import { BuyerPortalPage } from './buyer/BuyerPortalPage';
import { SellerPortalPage } from './seller/SellerPortalPage';

interface PortalMarketplacePageProps {
    portalType: 'buyer' | 'seller';
    onLogout: () => void;
}

export const PortalMarketplacePage: React.FC<PortalMarketplacePageProps> = ({ portalType, onLogout }) => {
    if (portalType === 'buyer') {
        return <BuyerPortalPage onLogout={onLogout} />;
    }

    return <SellerPortalPage onLogout={onLogout} />;
};

export default PortalMarketplacePage;
