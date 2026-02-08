// =============================================================================
// Order Actions - Role-based action buttons
// =============================================================================

import React from 'react';
import { CheckCircle, Gear, Truck, Package, MapTrifold, Eye } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Order, OrderRole } from './orders.types';

interface OrderActionsProps {
  order: Order;
  role: OrderRole;
  onView: (order: Order) => void;
  onTrack?: (order: Order) => void;
  // Seller actions
  onConfirm?: (order: Order) => void;
  onProcess?: (order: Order) => void;
  onShip?: (order: Order) => void;
  onDeliver?: (order: Order) => void;
  // Buyer actions
  onConfirmDelivery?: (order: Order) => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  order,
  role,
  onView,
  onTrack,
  onConfirm,
  onProcess,
  onShip,
  onDeliver,
  onConfirmDelivery,
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
        return { label: 'Confirm', icon: CheckCircle, color: styles.success, onClick: () => onConfirm(order) };
      }
      if (order.status === 'confirmed' && onProcess) {
        return { label: 'Process', icon: Gear, color: '#8B5CF6', onClick: () => onProcess(order) };
      }
      if (order.status === 'processing' && onShip) {
        return { label: 'Ship', icon: Truck, color: styles.info, onClick: () => onShip(order) };
      }
      if (order.status === 'shipped' && onDeliver) {
        return { label: 'Delivered', icon: Package, color: styles.success, onClick: () => onDeliver(order) };
      }
    } else {
      if (order.status === 'shipped' && onConfirmDelivery) {
        return { label: 'Received', icon: CheckCircle, color: styles.success, onClick: () => onConfirmDelivery(order) };
      }
    }
    return null;
  };

  const primaryAction = getPrimaryAction();
  const canTrack = onTrack && !['cancelled', 'failed', 'refunded'].includes(order.status);

  return (
    <div className="flex items-center gap-1">
      {/* Primary action button */}
      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
          style={{ backgroundColor: `${primaryAction.color}15`, color: primaryAction.color }}
        >
          <primaryAction.icon size={12} weight="bold" />
          {primaryAction.label}
        </button>
      )}

      {/* Track button */}
      {canTrack && (
        <button
          onClick={() => onTrack(order)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-all hover:opacity-80"
          style={{ backgroundColor: `${styles.info}15`, color: styles.info }}
          title="Track Order"
        >
          <MapTrifold size={12} weight="bold" />
          Track
        </button>
      )}

      {/* View details button */}
      <button
        onClick={() => onView(order)}
        className="p-1.5 rounded transition-colors"
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
        <Eye size={14} />
      </button>
    </div>
  );
};
