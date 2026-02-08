// =============================================================================
// My Orders Page - Thin wrapper around UnifiedOrders
// =============================================================================

import React from 'react';
import { UnifiedOrders } from '../../components/orders';

interface MyOrdersProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export const MyOrders: React.FC<MyOrdersProps> = ({ onNavigate }) => (
  <UnifiedOrders role="buyer" onNavigate={onNavigate} />
);
