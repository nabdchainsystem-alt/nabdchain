// =============================================================================
// Unified Orders - Shared Types
// =============================================================================

import React from 'react';
import {
  MarketplaceOrder as Order,
  MarketplaceOrderStatus as OrderStatus,
  PaymentStatus,
  OrderHealthStatus,
} from '../../types/item.types';
import { Package, CheckCircle, ArrowsClockwise, Truck } from 'phosphor-react';

export type { Order, OrderStatus, PaymentStatus };
export type { OrderHealthStatus };

export type OrderRole = 'buyer' | 'seller';

export type SortOption = 'newest' | 'oldest' | 'total_high' | 'total_low' | 'sla_urgent' | 'delivery_soon';

export type HealthFilterOption = OrderHealthStatus | 'needs_action' | 'needs_attention' | '';

export interface UnifiedOrdersProps {
  role: OrderRole;
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

// =============================================================================
// Stats
// =============================================================================

export interface OrderStats {
  total: number;
  pendingConfirmation: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  closed: number;
  cancelled: number;
  totalRevenue: number;
  // Health
  onTrack: number;
  atRisk: number;
  delayed: number;
  critical: number;
  withExceptions: number;
  needsAction: number;
}

// =============================================================================
// Stepper Configuration
// =============================================================================

export interface StepperStep {
  key: string;
  label: string;
  icon: React.ElementType;
  activeStatuses: string[];
  completedStatuses: string[];
  timestampKey?: keyof Order;
}

export const STEPPER_STEPS: StepperStep[] = [
  {
    key: 'placed',
    label: 'Placed',
    icon: Package,
    activeStatuses: [],
    completedStatuses: ['pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'closed'],
    timestampKey: 'createdAt',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle,
    activeStatuses: ['pending_confirmation'],
    completedStatuses: ['confirmed', 'processing', 'shipped', 'delivered', 'closed'],
    timestampKey: 'confirmedAt',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    icon: ArrowsClockwise,
    activeStatuses: ['confirmed'],
    completedStatuses: ['processing', 'shipped', 'delivered', 'closed'],
    timestampKey: 'processingAt',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: Truck,
    activeStatuses: ['processing'],
    completedStatuses: ['shipped', 'delivered', 'closed'],
    timestampKey: 'shippedAt',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: Package,
    activeStatuses: ['shipped'],
    completedStatuses: ['delivered', 'closed'],
    timestampKey: 'deliveredAt',
  },
];

// =============================================================================
// SLA Configuration
// =============================================================================

export const SLA_CONFIG = {
  confirmation: { hours: 24, label: 'Confirm' },
  shipping: { hours: 72, label: 'Ship' },
  delivery: { days: 7, label: 'Deliver' },
};

export interface SLAResult {
  hours: number;
  text: string;
  statusText: string;
  timeText: string;
  isOverdue: boolean;
  urgency: 'ok' | 'warning' | 'critical';
  percentUsed: number;
}

export interface DeliveryResult {
  text: string;
  urgency: 'ok' | 'soon' | 'overdue';
  daysRemaining?: number;
}
