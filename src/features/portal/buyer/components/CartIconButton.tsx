// =============================================================================
// Cart Icon Button - TopBar button with cart icon and badge
// =============================================================================

import React from 'react';
import { ShoppingCart } from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useCart } from '../../context/CartContext';

interface CartIconButtonProps {
  onClick: () => void;
}

export const CartIconButton: React.FC<CartIconButtonProps> = ({ onClick }) => {
  const { styles } = usePortal();
  const { cart, isLoading } = useCart();

  const itemCount = cart?.itemCount || 0;
  const showBadge = itemCount > 0;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg transition-colors"
      style={{ color: styles.textMuted }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = styles.bgHover;
        e.currentTarget.style.color = styles.textPrimary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = styles.textMuted;
      }}
      aria-label={`Cart${showBadge ? ` (${itemCount} items)` : ''}`}
    >
      <ShoppingCart size={18} weight={showBadge ? 'fill' : 'regular'} />

      {/* Badge */}
      {showBadge && !isLoading && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
          style={{
            backgroundColor: styles.info,
            color: '#fff',
          }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartIconButton;
