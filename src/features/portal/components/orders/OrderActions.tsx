// =============================================================================
// Order Actions - Role-based icon-only action buttons
// =============================================================================

import React from 'react';
import {
  CheckCircle,
  Gear,
  Truck,
  Package,
  MapTrifold,
  Eye,
  ProhibitInset,
  CurrencyDollar,
  Money,
  Receipt,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Order, OrderRole } from './orders.types';
import { isOrderFullyComplete } from './orders.utils';

interface OrderActionsProps {
  order: Order;
  role: OrderRole;
  onView: (order: Order) => void;
  onTrack?: (order: Order) => void;
  // Seller actions
  onConfirm?: (order: Order) => void;
  onReject?: (order: Order) => void;
  onProcess?: (order: Order) => void;
  onShip?: (order: Order) => void;
  onDeliver?: (order: Order) => void;
  // Buyer actions
  onConfirmDelivery?: (order: Order) => void;
  onPay?: (order: Order) => void;
}

/**
 * Check if the buyer should see a "Pay" button for this order.
 * Logic varies by payment method.
 */
function canShowPayAction(order: Order): boolean {
  if (['cancelled', 'refunded', 'failed'].includes(order.status)) return false;
  // Fully paid or authorized (pending seller confirmation) → hide
  if (['paid', 'paid_cash', 'authorized', 'refunded'].includes(order.paymentStatus)) return false;
  if (order.invoiceStatus === 'paid') return false;
  // Guard by remaining amount
  if ((order.remainingAmount ?? order.totalPrice) <= 0) return false;

  const method = order.paymentMethod || 'bank_transfer';

  // COD: only show after delivery
  if (method === 'cod') {
    return order.status === 'delivered';
  }

  // Credit: show when unpaid_credit and invoice exists
  if (method === 'credit') {
    return order.paymentStatus === 'unpaid_credit' && !!order.invoiceId;
  }

  // Bank transfer: show when unpaid, partial, or pending_conf
  return ['unpaid', 'partial', 'pending_conf'].includes(order.paymentStatus);
}

/**
 * Get pay button configuration based on payment method
 */
function getPayButtonConfig(order: Order): { label: string; icon: React.ElementType } {
  const method = order.paymentMethod || 'bank_transfer';
  if (method === 'cod') return { label: 'Confirm Cash', icon: Money };
  if (method === 'credit') return { label: 'Pay Invoice', icon: Receipt };
  return { label: 'Pay', icon: CurrencyDollar };
}

/**
 * Get paid badge text based on payment status
 */
function getPaidBadge(order: Order): string | null {
  if (order.paymentStatus === 'paid') return 'Paid';
  if (order.paymentStatus === 'paid_cash') return 'Paid (Cash)';
  return null;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  order,
  role,
  onView,
  onTrack,
  onConfirm,
  onReject,
  onProcess,
  onShip,
  onDeliver,
  onConfirmDelivery,
  onPay,
}) => {
  const { styles } = usePortal();

  // Primary action based on status and role
  const getPrimaryAction = (): {
    label: string;
    icon: React.ElementType;
    color: string;
    onClick: () => void;
  } | null => {
    if (role === 'seller') {
      if (order.status === 'pending_confirmation' && onConfirm) {
        return { label: 'Confirm Order', icon: CheckCircle, color: styles.success, onClick: () => onConfirm(order) };
      }
      if (order.status === 'confirmed' && onProcess) {
        return { label: 'Start Processing', icon: Gear, color: '#8B5CF6', onClick: () => onProcess(order) };
      }
      if (order.status === 'processing' && onShip) {
        return { label: 'Ship Order', icon: Truck, color: styles.info, onClick: () => onShip(order) };
      }
      if (order.status === 'shipped' && onDeliver) {
        return { label: 'Mark Delivered', icon: Package, color: styles.success, onClick: () => onDeliver(order) };
      }
    } else {
      if (order.status === 'shipped' && onConfirmDelivery) {
        return {
          label: 'Confirm Received',
          icon: CheckCircle,
          color: styles.success,
          onClick: () => onConfirmDelivery(order),
        };
      }
    }
    return null;
  };

  const primaryAction = getPrimaryAction();
  const canTrack = onTrack && ['shipped', 'delivered'].includes(order.status) && !isOrderFullyComplete(order);
  const showPay = role === 'buyer' && onPay && canShowPayAction(order);
  const payConfig = showPay ? getPayButtonConfig(order) : null;
  const paidBadge = getPaidBadge(order);

  return (
    <div className="flex items-center gap-1 justify-center w-full">
      {/* Primary action */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="p-1.5 rounded-md transition-all hover:scale-110"
          style={{ backgroundColor: `${primaryAction.color}12`, color: primaryAction.color }}
          title={primaryAction.label}
        >
          <primaryAction.icon size={15} weight="bold" />
        </button>
      )}

      {/* Pay (buyer, order not fully paid) */}
      {showPay && payConfig && (
        <button
          onClick={() => onPay(order)}
          className="p-1.5 rounded-md transition-all hover:scale-110"
          style={{ backgroundColor: `${styles.success}12`, color: styles.success }}
          title={payConfig.label}
        >
          <payConfig.icon size={15} weight="bold" />
        </button>
      )}

      {/* Paid indicator (buyer, fully paid) */}
      {role === 'buyer' && paidBadge && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
          style={{ backgroundColor: `${styles.success}15`, color: styles.success }}
          title={paidBadge}
        >
          <CheckCircle size={10} weight="fill" />
          {paidBadge}
        </span>
      )}

      {/* Credit Due indicator (buyer, credit unpaid) */}
      {role === 'buyer' && order.paymentStatus === 'unpaid_credit' && !showPay && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
          style={{ backgroundColor: `${styles.warning}15`, color: styles.warning }}
          title="Credit Due"
        >
          Credit Due
        </span>
      )}

      {/* Reject (seller, pending_confirmation only) */}
      {role === 'seller' && order.status === 'pending_confirmation' && onReject && (
        <button
          onClick={() => onReject(order)}
          className="p-1.5 rounded-md transition-all hover:scale-110"
          style={{ backgroundColor: `${styles.error}12`, color: styles.error }}
          title="Reject Order"
        >
          <ProhibitInset size={15} weight="bold" />
        </button>
      )}

      {/* Track */}
      {canTrack && (
        <button
          onClick={() => onTrack(order)}
          className="p-1.5 rounded-md transition-all hover:scale-110"
          style={{ backgroundColor: `${styles.info}12`, color: styles.info }}
          title="Track Order"
        >
          <MapTrifold size={15} weight="bold" />
        </button>
      )}

      {/* View details */}
      <button
        onClick={() => onView(order)}
        className="p-1.5 rounded-md transition-colors"
        style={{ color: styles.textMuted }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = styles.bgHover;
          e.currentTarget.style.color = styles.info;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = styles.textMuted;
        }}
        title="View Details"
      >
        <Eye size={15} />
      </button>
    </div>
  );
};
