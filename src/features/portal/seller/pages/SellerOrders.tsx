// =============================================================================
// Seller Orders Page - Thin wrapper around UnifiedOrders
// =============================================================================

import React from 'react';
import { UnifiedOrders } from '../../components/orders';

interface SellerOrdersProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export const SellerOrders: React.FC<SellerOrdersProps> = ({ onNavigate }) => (
  <UnifiedOrders role="seller" onNavigate={onNavigate} />
);
