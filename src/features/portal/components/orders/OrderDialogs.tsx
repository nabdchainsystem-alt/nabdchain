// =============================================================================
// Order Dialogs - Seller-only confirmation modals
// =============================================================================

import React, { useState } from 'react';
import { X, Truck, XCircle, CheckCircle, Gear, ProhibitInset, WarningCircle, Spinner, Timer } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { PortalDatePicker } from '../../components';
import type { Order } from './orders.types';

// =============================================================================
// Dialog Shell
// =============================================================================

const DialogShell: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => {
  const { styles } = usePortal();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: styles.bgPrimary }}
      >
        {children}
      </div>
    </>
  );
};

const DialogHeader: React.FC<{
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}> = ({ icon: Icon, iconColor, title, subtitle, onClose }) => {
  const { styles } = usePortal();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: styles.border }}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${iconColor}15` }}>
          <Icon size={20} weight="fill" style={{ color: iconColor }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: styles.textPrimary }}>
            {title}
          </h2>
          <p className="text-xs" style={{ color: styles.textMuted }}>
            {subtitle}
          </p>
        </div>
      </div>
      <button onClick={onClose} className="p-2 rounded-lg" style={{ color: styles.textMuted }}>
        <X size={20} />
      </button>
    </div>
  );
};

const ErrorBanner: React.FC<{ error: string | null }> = ({ error }) => {
  const { styles } = usePortal();
  if (!error) return null;

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${styles.error}15` }}>
      <WarningCircle size={18} weight="fill" style={{ color: styles.error }} />
      <span className="text-sm" style={{ color: styles.error }}>
        {error}
      </span>
    </div>
  );
};

// =============================================================================
// Confirm Order Dialog
// =============================================================================

export const ConfirmOrderDialog: React.FC<{
  order: Order;
  onConfirm: (order: Order) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ order, onConfirm, onClose, isLoading, error }) => {
  const { styles, t } = usePortal();

  return (
    <DialogShell onClose={onClose}>
      <DialogHeader
        icon={CheckCircle}
        iconColor={styles.success}
        title="Confirm this order?"
        subtitle={order.orderNumber || order.id}
        onClose={onClose}
      />
      <div className="p-6 space-y-4">
        <p className="text-sm" style={{ color: styles.textSecondary }}>
          By confirming, you commit to preparing and shipping this order within the agreed timeframe.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${styles.info}10` }}>
          <Timer size={18} weight="duotone" style={{ color: styles.info }} />
          <span className="text-sm" style={{ color: styles.info }}>
            You'll have <strong>72 hours</strong> to ship this order after confirmation.
          </span>
        </div>
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: styles.textMuted }}>Item</span>
            <span style={{ color: styles.textPrimary }}>{order.itemName || 'Order Item'}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: styles.textMuted }}>Quantity</span>
            <span style={{ color: styles.textPrimary }}>{order.quantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: styles.textMuted }}>Total</span>
            <span style={{ color: styles.textPrimary, fontWeight: 600 }}>
              {order.totalPrice?.toLocaleString()} {order.currency || 'SAR'}
            </span>
          </div>
        </div>
        <ErrorBanner error={error} />
      </div>
      <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: styles.border }}>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
        >
          {t('common.cancel') || 'Cancel'}
        </button>
        <button
          onClick={() => {
            onConfirm(order);
            onClose();
          }}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold disabled:opacity-50"
          style={{ backgroundColor: styles.success, color: '#fff' }}
        >
          {isLoading ? <Spinner size={20} className="animate-spin" /> : <CheckCircle size={20} weight="fill" />}
          {isLoading ? 'Confirming...' : 'Confirm Order'}
        </button>
      </div>
    </DialogShell>
  );
};

// =============================================================================
// Processing Dialog
// =============================================================================

export const ProcessingDialog: React.FC<{
  order: Order;
  onProcess: (order: Order) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ order, onProcess, onClose, isLoading, error }) => {
  const { styles } = usePortal();

  return (
    <DialogShell onClose={onClose}>
      <DialogHeader
        icon={Gear}
        iconColor="#8B5CF6"
        title="Start preparing this order?"
        subtitle={order.orderNumber || order.id}
        onClose={onClose}
      />
      <div className="p-6 space-y-4">
        <p className="text-sm" style={{ color: styles.textSecondary }}>
          This marks the order as "Preparing" so the buyer knows you're working on it.
        </p>
        <div
          className="p-4 rounded-lg border"
          style={{ borderColor: styles.border, backgroundColor: styles.bgSecondary }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: styles.textMuted }}>Item</span>
            <span style={{ color: styles.textPrimary }}>{order.itemName || 'Order Item'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: styles.textMuted }}>Quantity</span>
            <span style={{ color: styles.textPrimary }}>{order.quantity}</span>
          </div>
        </div>
        <ErrorBanner error={error} />
      </div>
      <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: styles.border }}>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onProcess(order);
            onClose();
          }}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold disabled:opacity-50"
          style={{ backgroundColor: '#8B5CF6', color: '#fff' }}
        >
          {isLoading ? <Spinner size={20} className="animate-spin" /> : <Gear size={20} weight="fill" />}
          {isLoading ? 'Processing...' : 'Start Preparing'}
        </button>
      </div>
    </DialogShell>
  );
};

// =============================================================================
// Ship Order Dialog
// =============================================================================

export const ShipOrderDialog: React.FC<{
  order: Order;
  onShip: (order: Order, trackingNumber: string, carrier: string, estimatedDelivery?: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ order, onShip, onClose, isLoading, error }) => {
  const { styles, t } = usePortal();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const handleClose = () => {
    setTrackingNumber('');
    setCarrier('');
    setEstimatedDelivery('');
    onClose();
  };

  return (
    <DialogShell onClose={handleClose}>
      <DialogHeader
        icon={Truck}
        iconColor={styles.info}
        title={t('seller.orders.shipOrder') || 'Ship Order'}
        subtitle={order.orderNumber || order.id}
        onClose={handleClose}
      />
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
            {t('seller.orders.trackingNumber') || 'Tracking Number'} *
          </label>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border"
            style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border, color: styles.textPrimary }}
            placeholder={t('seller.orders.trackingNumberPlaceholder') || 'Enter tracking number'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
            {t('seller.orders.carrier') || 'Carrier'}
          </label>
          <input
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border"
            style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border, color: styles.textPrimary }}
            placeholder={t('seller.orders.carrierPlaceholder') || 'e.g. DHL, FedEx, Aramex'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: styles.textPrimary }}>
            {t('seller.orders.estimatedDelivery') || 'Estimated Delivery'}
          </label>
          <PortalDatePicker value={estimatedDelivery} onChange={setEstimatedDelivery} className="w-full" />
        </div>
        <ErrorBanner error={error} />
      </div>
      <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: styles.border }}>
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
        >
          {t('common.cancel') || 'Cancel'}
        </button>
        <button
          onClick={() => {
            onShip(order, trackingNumber.trim(), carrier.trim(), estimatedDelivery || undefined);
            handleClose();
          }}
          disabled={isLoading || !trackingNumber.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold disabled:opacity-50"
          style={{ backgroundColor: styles.info, color: '#fff' }}
        >
          {isLoading ? <Spinner size={20} className="animate-spin" /> : <Truck size={20} weight="fill" />}
          {isLoading ? t('common.processing') || 'Processing...' : t('seller.orders.shipOrder') || 'Ship Order'}
        </button>
      </div>
    </DialogShell>
  );
};

// =============================================================================
// Reject Order Dialog
// =============================================================================

export const RejectOrderDialog: React.FC<{
  order: Order;
  onReject: (order: Order, reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ order, onReject, onClose, isLoading, error }) => {
  const { styles, t } = usePortal();
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <DialogShell onClose={handleClose}>
      <DialogHeader
        icon={ProhibitInset}
        iconColor={styles.error}
        title={t('seller.orders.rejectOrder') || 'Reject Order'}
        subtitle={order.orderNumber || order.id}
        onClose={handleClose}
      />
      <div className="p-6 space-y-4">
        <p className="text-sm" style={{ color: styles.textSecondary }}>
          {t('seller.orders.rejectReasonPrompt') || 'Please provide a reason for rejecting this order.'}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border resize-none"
          style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border, color: styles.textPrimary }}
          placeholder={t('seller.orders.rejectReasonPlaceholder') || 'Enter rejection reason...'}
        />
        <ErrorBanner error={error} />
      </div>
      <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: styles.border }}>
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
        >
          {t('common.cancel') || 'Cancel'}
        </button>
        <button
          onClick={() => {
            onReject(order, reason.trim());
            handleClose();
          }}
          disabled={isLoading || !reason.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold disabled:opacity-50"
          style={{ backgroundColor: styles.error, color: '#fff' }}
        >
          {isLoading ? <Spinner size={20} className="animate-spin" /> : <ProhibitInset size={20} weight="fill" />}
          {isLoading ? t('common.processing') || 'Processing...' : t('seller.orders.rejectOrder') || 'Reject Order'}
        </button>
      </div>
    </DialogShell>
  );
};

// =============================================================================
// Cancel Order Dialog
// =============================================================================

export const CancelOrderDialog: React.FC<{
  order: Order;
  onCancel: (order: Order, reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ order, onCancel, onClose, isLoading, error }) => {
  const { styles, t } = usePortal();
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <DialogShell onClose={handleClose}>
      <DialogHeader
        icon={XCircle}
        iconColor={styles.error}
        title={t('seller.orders.cancelOrder') || 'Cancel Order'}
        subtitle={order.orderNumber || order.id}
        onClose={handleClose}
      />
      <div className="p-6 space-y-4">
        <p className="text-sm" style={{ color: styles.textSecondary }}>
          {t('seller.orders.cancelReasonPrompt') || 'Please provide a reason for cancelling this order.'}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border resize-none"
          style={{ backgroundColor: styles.bgSecondary, borderColor: styles.border, color: styles.textPrimary }}
          placeholder={t('seller.orders.cancelReasonPlaceholder') || 'Enter cancellation reason...'}
        />
        <ErrorBanner error={error} />
      </div>
      <div className="flex gap-3 px-6 py-4 border-t" style={{ borderColor: styles.border }}>
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="flex-1 py-3 rounded-lg font-medium"
          style={{ backgroundColor: styles.bgSecondary, color: styles.textSecondary }}
        >
          {t('common.back') || 'Back'}
        </button>
        <button
          onClick={() => {
            onCancel(order, reason.trim());
            handleClose();
          }}
          disabled={isLoading || !reason.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold disabled:opacity-50"
          style={{ backgroundColor: styles.error, color: '#fff' }}
        >
          {isLoading ? <Spinner size={20} className="animate-spin" /> : <XCircle size={20} weight="fill" />}
          {isLoading ? t('common.processing') || 'Processing...' : t('seller.orders.cancelOrder') || 'Cancel Order'}
        </button>
      </div>
    </DialogShell>
  );
};
