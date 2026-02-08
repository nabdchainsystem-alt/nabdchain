import React from 'react';
import { useParams } from 'react-router-dom';
import { featureLogger } from '../../utils/logger';
import { PortalProvider } from './context/PortalContext';
import { SellerPublicProfile } from './seller/pages/SellerPublicProfile';

/**
 * Public Seller Profile Page
 * Accessible at /seller/:slug without authentication
 * Wraps SellerPublicProfile with PortalProvider for theme and translations
 */
export const SellerProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Invalid seller profile URL</p>
      </div>
    );
  }

  return (
    <PortalProvider>
      <SellerPublicProfile
        slug={slug}
        onNavigateToProduct={(productId) => {
          // Navigate to product details
          window.location.href = `/marketplace/item/${productId}`;
        }}
        onRequestRFQ={(sellerId) => {
          // Navigate to RFQ page or open modal
          featureLogger.info('Request RFQ for seller:', sellerId);
        }}
      />
    </PortalProvider>
  );
};

export default SellerProfilePage;
