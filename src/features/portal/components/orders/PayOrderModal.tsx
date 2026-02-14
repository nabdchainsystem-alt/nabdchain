// =============================================================================
// Pay Order Modal - Multi-method payment (bank transfer / COD / credit)
// =============================================================================

import React, { useState } from 'react';
import { X, CurrencyDollar, Bank, Spinner, CheckCircle, Warning, Money } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { Order } from './orders.types';
import { formatCurrency } from './orders.utils';

interface PayOrderModalProps {
  order: Order;
  onSubmit: (
    order: Order,
    data: {
      method: 'bank_transfer';
      reference: string;
      amount?: number;
      bankName?: string;
      notes?: string;
    },
  ) => Promise<void>;
  onConfirmCOD?: (order: Order, notes?: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

export const PayOrderModal: React.FC<PayOrderModalProps> = ({
  order,
  onSubmit,
  onConfirmCOD,
  onClose,
  isLoading,
  error,
}) => {
  const { styles } = usePortal();
  const orderMethod = order.paymentMethod || 'bank_transfer';
  const isCOD = orderMethod === 'cod';

  // Payment aggregates
  const paidAmount = order.paidAmount ?? 0;
  const remaining = order.remainingAmount ?? order.totalPrice;
  const hasPartialPayment = paidAmount > 0 && paidAmount < order.totalPrice;

  // Bank transfer form state
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState(remaining.toString());
  const [notes, setNotes] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    const payAmount = useCustomAmount ? parseFloat(amount) : undefined;
    // Client-side guard: don't exceed remaining
    if (payAmount && payAmount > remaining * 1.001) return;

    await onSubmit(order, {
      method: 'bank_transfer',
      reference: reference.trim(),
      amount: payAmount,
      bankName: bankName.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleCODConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onConfirmCOD) {
      await onConfirmCOD(order, notes.trim() || undefined);
    }
  };

  const hasInvoice = !!order.invoiceId;

  // Title based on method
  const title = isCOD ? 'Confirm Cash Payment' : hasPartialPayment ? 'Record Additional Payment' : 'Record Payment';
  const icon = isCOD ? Money : CurrencyDollar;
  const Icon = icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl border shadow-xl"
        style={{ backgroundColor: styles.bgCard, borderColor: styles.border }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${styles.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${styles.success}15` }}
            >
              <Icon size={20} weight="bold" style={{ color: styles.success }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
                {title}
              </h3>
              <p className="text-xs" style={{ color: styles.textMuted }}>
                {order.orderNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: styles.textMuted }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={isCOD ? handleCODConfirm : handleBankSubmit} className="px-5 py-4 space-y-4">
          {/* Order summary */}
          <div className="rounded-lg p-3" style={{ backgroundColor: styles.bgSecondary }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: styles.textMuted }}>Order Total</span>
              <span className="font-semibold" style={{ color: styles.textPrimary }}>
                {formatCurrency(order.totalPrice, order.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span style={{ color: styles.textMuted }}>Item</span>
              <span style={{ color: styles.textSecondary }}>
                {order.itemName} x{order.quantity}
              </span>
            </div>
            {/* Payment progress */}
            {hasPartialPayment && (
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${styles.border}` }}>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: styles.success }}>Already Paid</span>
                  <span className="font-semibold" style={{ color: styles.success }}>
                    {formatCurrency(paidAmount, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span style={{ color: styles.warning }}>Remaining</span>
                  <span className="font-semibold" style={{ color: styles.warning }}>
                    {formatCurrency(remaining, order.currency)}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${styles.border}` }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: styles.success,
                      width: `${Math.min(100, (paidAmount / order.totalPrice) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {hasInvoice && (
              <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${styles.border}` }}>
                <CheckCircle size={12} weight="fill" style={{ color: styles.info }} />
                <span className="text-xs" style={{ color: styles.info }}>
                  Invoice {order.invoiceNumber} exists
                </span>
              </div>
            )}
            {!hasInvoice && !isCOD && !hasPartialPayment && (
              <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: `1px solid ${styles.border}` }}>
                <Warning size={12} weight="fill" style={{ color: styles.warning }} />
                <span className="text-xs" style={{ color: styles.warning }}>
                  No invoice yet - payment will be linked when invoice is generated
                </span>
              </div>
            )}
          </div>

          {isCOD ? (
            /* ---- COD Confirmation Form ---- */
            <>
              <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: `${styles.info}10` }}>
                <Money size={16} weight="fill" className="mt-0.5 flex-shrink-0" style={{ color: styles.info }} />
                <p className="text-xs" style={{ color: styles.textSecondary }}>
                  Confirm that cash payment of <strong>{formatCurrency(order.totalPrice, order.currency)}</strong> has
                  been received for this order.
                </p>
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: styles.textSecondary }}>
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about the cash payment..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </div>
            </>
          ) : (
            /* ---- Bank Transfer Form ---- */
            <>
              {/* Bank Reference (required) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: styles.textSecondary }}>
                  Bank Transfer Reference *
                </label>
                <div className="relative">
                  <Bank
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: styles.textMuted }}
                  />
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. TRF-20240215-001"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                    style={{
                      backgroundColor: styles.bgPrimary,
                      borderColor: styles.border,
                      color: styles.textPrimary,
                    }}
                  />
                </div>
              </div>

              {/* Bank Name (optional) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: styles.textSecondary }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Al Rajhi Bank"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </div>

              {/* Custom amount toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomAmount}
                    onChange={(e) => {
                      setUseCustomAmount(e.target.checked);
                      if (!e.target.checked) setAmount(remaining.toString());
                    }}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: styles.textSecondary }}>
                    Partial payment (different amount)
                  </span>
                </label>
                {useCustomAmount && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      max={remaining}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        backgroundColor: styles.bgPrimary,
                        borderColor: styles.border,
                        color: styles.textPrimary,
                      }}
                    />
                    <p className="text-[10px] mt-1" style={{ color: styles.textMuted }}>
                      Max: {formatCurrency(remaining, order.currency)}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: styles.textSecondary }}>
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional payment notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{
                    backgroundColor: styles.bgPrimary,
                    borderColor: styles.border,
                    color: styles.textPrimary,
                  }}
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-lg p-3 text-sm flex items-start gap-2"
              style={{ backgroundColor: `${styles.error}10`, color: styles.error }}
            >
              <Warning size={16} weight="fill" className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors"
              style={{
                borderColor: styles.border,
                color: styles.textSecondary,
                backgroundColor: 'transparent',
              }}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!isCOD && !reference.trim())}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: (!isCOD && !reference.trim()) || isLoading ? `${styles.success}40` : styles.success,
                color: '#fff',
              }}
            >
              {isLoading ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  {isCOD ? 'Confirming...' : 'Recording...'}
                </>
              ) : (
                <>
                  <Icon size={14} weight="bold" />
                  {isCOD ? 'Confirm Cash Received' : 'Record Payment'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
