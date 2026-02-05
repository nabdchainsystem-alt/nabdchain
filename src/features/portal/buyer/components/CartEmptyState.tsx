// =============================================================================
// Cart Empty State - Displayed when cart has no items
// =============================================================================

import React from 'react';
import { ShoppingCart, MagnifyingGlass } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';

interface CartEmptyStateProps {
  onBrowse?: () => void;
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({ onBrowse }) => {
  const { styles, t, direction } = usePortal();
  const isRtl = direction === 'rtl';

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4"
      style={{ minHeight: 'min(400px, 60vh)' }}
    >
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${styles.info}10` }}
      >
        <ShoppingCart size={40} weight="duotone" style={{ color: styles.info }} />
      </div>

      {/* Title */}
      <h2
        className="text-xl font-semibold mb-2 text-center"
        style={{ color: styles.textPrimary }}
      >
        {t('cart.empty.title') || 'Your cart is empty'}
      </h2>

      {/* Description */}
      <p
        className="text-center mb-8 max-w-md"
        style={{ color: styles.textMuted }}
      >
        {t('cart.empty.description') ||
          'Browse the marketplace to find parts and products. Add items to your cart to request quotes from sellers.'}
      </p>

      {/* CTA Button */}
      {onBrowse && (
        <button
          onClick={onBrowse}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90 ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
          style={{
            backgroundColor: styles.info,
            color: '#fff',
          }}
        >
          <MagnifyingGlass size={20} weight="bold" />
          <span>{t('cart.empty.browse') || 'Browse Marketplace'}</span>
        </button>
      )}

      {/* Microcopy */}
      <div className="mt-8 space-y-2 text-center">
        <p className="text-sm" style={{ color: styles.textMuted }}>
          {t('cart.empty.hint1') || 'No payment required at checkout'}
        </p>
        <p className="text-sm" style={{ color: styles.textMuted }}>
          {t('cart.empty.hint2') || 'Request quotes from multiple sellers at once'}
        </p>
      </div>
    </div>
  );
};

export default CartEmptyState;
