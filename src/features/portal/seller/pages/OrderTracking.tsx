// =============================================================================
// Seller Order Tracking Page
// =============================================================================
// Wrapper component for seller's order tracking view
// =============================================================================

import React from 'react';
import { UnifiedOrderTracking } from '../../components/tracking';

interface OrderTrackingProps {
  orderId: string;
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  onNavigate,
}) => {
  const handleClose = () => {
    // Navigate back to orders list
    onNavigate('orders');
  };

  return (
    <UnifiedOrderTracking
      orderId={orderId}
      role="seller"
      onNavigate={onNavigate}
      onClose={handleClose}
    />
  );
};

export default OrderTracking;
