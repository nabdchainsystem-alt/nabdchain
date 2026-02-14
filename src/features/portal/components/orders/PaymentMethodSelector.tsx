// =============================================================================
// Payment Method Selector - Radio Card Selector for Order Creation
// =============================================================================

import React from 'react';
import { Bank, Money, CreditCard } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import type { OrderPaymentMethod } from '../../types/item.types';

interface PaymentMethodOption {
  value: OrderPaymentMethod;
  label: string;
  description: string;
  icon: React.ElementType;
  disabledReason?: string;
}

interface PaymentMethodSelectorProps {
  value: OrderPaymentMethod;
  onChange: (method: OrderPaymentMethod) => void;
  creditEnabled?: boolean;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  creditEnabled = false,
  disabled = false,
}) => {
  const { styles } = usePortal();

  const options: PaymentMethodOption[] = [
    {
      value: 'bank_transfer',
      label: 'Bank Transfer',
      description: 'Pay via bank transfer',
      icon: Bank,
    },
    {
      value: 'cod',
      label: 'Cash on Delivery',
      description: 'Pay cash when delivered',
      icon: Money,
    },
    {
      value: 'credit',
      label: 'Credit / Pay Later',
      description: 'Pay later against invoice',
      icon: CreditCard,
      disabledReason: creditEnabled ? undefined : 'Credit not enabled for your account',
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider" style={{ color: styles.textMuted }}>
        Payment Method
      </p>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = disabled || !!option.disabledReason;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(option.value)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left"
              style={{
                borderColor: isSelected ? styles.info : styles.borderLight,
                backgroundColor: isSelected ? `${styles.info}08` : isDisabled ? `${styles.textMuted}05` : 'transparent',
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isSelected ? `${styles.info}15` : styles.bgSecondary,
                }}
              >
                <Icon
                  size={18}
                  weight={isSelected ? 'fill' : 'regular'}
                  style={{ color: isSelected ? styles.info : styles.textMuted }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{ color: isDisabled ? styles.textMuted : styles.textPrimary }}
                >
                  {option.label}
                </p>
                <p className="text-xs" style={{ color: styles.textMuted }}>
                  {option.disabledReason || option.description}
                </p>
              </div>
              {/* Radio indicator */}
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: isSelected ? styles.info : styles.borderLight,
                }}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: styles.info }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
