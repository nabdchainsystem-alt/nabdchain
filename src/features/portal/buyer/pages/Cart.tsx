// =============================================================================
// Cart Page - Dual Purchase Flow (Buy Now + Request Quote)
// =============================================================================
// Supports both instant purchase and RFQ-based negotiation
// Clear separation between "Confirmed Price" (Buy Now) and "Estimated Price" (RFQ)
// Items grouped by seller with visual flow indicators
// =============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import {
  ShoppingCart,
  ArrowLeft,
  SpinnerGap,
  Package,
  Storefront,
  Lightning,
  PaperPlaneTilt,
  Trash,
  ArrowRight,
  Clock,
  Info,
  CheckCircle,
} from 'phosphor-react';
import { usePortal } from '../../context/PortalContext';
import { useCart } from '../../context/CartContext';
import { CartEmptyState } from '../components/CartEmptyState';
import { CartSellerGroup } from '../components/CartSellerGroup';
import { BuyNowConfirmModal } from '../components/BuyNowConfirmModal';
import { Container, PageHeader, Button } from '../../components';
import {
  Cart as CartType,
  CartSellerGroup as CartSellerGroupType,
  CartItem,
  CartItemEligibility,
  PurchaseMethod,
} from '../../types/cart.types';

interface CartPageProps {
  onNavigate?: (page: string) => void;
}

// =============================================================================
// Helper: Check Buy Now eligibility for an item
// =============================================================================
function getItemEligibility(item: CartItem): CartItemEligibility {
  const stock = item.item?.stock ?? 0;
  const status = item.item?.status;
  const allowDirectPurchase = item.item?.allowDirectPurchase ?? true;
  const isFixedPrice = item.item?.isFixedPrice ?? true;

  if (status !== 'active') {
    return {
      buyNow: { eligible: false, reason: 'Item not available' },
      recommendedMethod: 'request_quote',
    };
  }

  if (stock === 0) {
    return {
      buyNow: { eligible: false, reason: 'Out of stock' },
      recommendedMethod: 'request_quote',
    };
  }

  if (stock < item.quantity) {
    return {
      buyNow: { eligible: false, reason: `Only ${stock} in stock` },
      recommendedMethod: 'request_quote',
    };
  }

  if (!allowDirectPurchase) {
    return {
      buyNow: { eligible: false, reason: 'Quote only item' },
      recommendedMethod: 'request_quote',
    };
  }

  if (!isFixedPrice) {
    return {
      buyNow: { eligible: false, reason: 'Price requires quote' },
      recommendedMethod: 'request_quote',
    };
  }

  return {
    buyNow: { eligible: true },
    recommendedMethod: 'buy_now',
  };
}

// =============================================================================
// Price Type Badge Component - Confirmed vs Estimated
// =============================================================================
const PriceTypeBadge: React.FC<{
  type: 'confirmed' | 'estimated';
  size?: 'sm' | 'md';
}> = ({ type, size = 'sm' }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const isConfirmed = type === 'confirmed';
  const color = isConfirmed ? styles.success : '#f59e0b';
  const Icon = isConfirmed ? CheckCircle : Clock;
  const label = isConfirmed ? 'Confirmed Price' : 'Estimated Price';

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${isRtl ? 'flex-row-reverse' : ''} ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      }`}
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
      title={isConfirmed ? 'Fixed price - ready for immediate purchase' : 'Price may be negotiated after quote request'}
    >
      <Icon size={size === 'sm' ? 10 : 12} weight="fill" />
      <span>{label}</span>
    </div>
  );
};

// =============================================================================
// Summary Card Component
// =============================================================================
const SummaryCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  priceType?: 'confirmed' | 'estimated';
  highlight?: boolean;
}> = ({ icon: Icon, label, value, color, subtitle, priceType, highlight = false }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${highlight ? 'ring-2 ring-offset-1' : ''}`}
      style={{
        backgroundColor: highlight ? `${color}08` : styles.bgCard,
        borderColor: highlight ? `${color}40` : styles.border,
        ringColor: highlight ? `${color}40` : 'transparent',
      }}
    >
      <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} weight="duotone" />
        </div>
        <div className={`min-w-0 flex-1 ${isRtl ? 'text-right' : ''}`}>
          <div className="text-xs" style={{ color: styles.textMuted }}>
            {label}
          </div>
          <div className="text-lg font-bold" style={{ color: styles.textPrimary }}>
            {value}
          </div>
          {subtitle && (
            <div className="text-xs" style={{ color: styles.textMuted }}>
              {subtitle}
            </div>
          )}
          {priceType && (
            <div className="mt-1">
              <PriceTypeBadge type={priceType} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Flow Info Banner Component - Shows price type and flow explanation
// =============================================================================
const FlowInfoBanner: React.FC<{
  type: 'buy_now' | 'rfq';
}> = ({ type }) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const isBuyNow = type === 'buy_now';
  const color = isBuyNow ? styles.success : '#f59e0b';
  const Icon = isBuyNow ? CheckCircle : Info;

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isRtl ? 'flex-row-reverse text-right' : ''}`}
      style={{
        backgroundColor: `${color}10`,
        color: styles.textSecondary,
      }}
    >
      <Icon size={14} weight="fill" style={{ color }} />
      <span>
        {isBuyNow
          ? 'These items have confirmed prices and are ready for immediate purchase. No negotiation needed.'
          : 'Prices shown are estimates. Submit a quote request to get final pricing and terms from sellers.'}
      </span>
    </div>
  );
};

// =============================================================================
// Action Panel Component - Enhanced with price type labels
// =============================================================================
const ActionPanel: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  buttonLabel: string;
  itemCount: number;
  total: number;
  currency: string;
  onAction: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  priceType: 'confirmed' | 'estimated';
  flowType: 'buy_now' | 'rfq';
}> = ({
  title,
  description,
  icon: Icon,
  color,
  buttonLabel,
  itemCount,
  total,
  currency,
  onAction,
  isProcessing,
  disabled,
  priceType,
  flowType,
}) => {
  const { styles, direction } = usePortal();
  const isRtl = direction === 'rtl';

  const hasItems = itemCount > 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${hasItems ? 'ring-1' : 'opacity-60'}`}
      style={{
        backgroundColor: `${color}05`,
        borderColor: `${color}30`,
        ringColor: hasItems ? `${color}20` : 'transparent',
      }}
    >
      {/* Header with price type badge */}
      <div
        className={`flex items-center justify-between p-4 ${isRtl ? 'flex-row-reverse' : ''}`}
        style={{ borderBottom: `1px solid ${color}20` }}
      >
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={22} style={{ color }} weight="fill" />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <h3
              className="text-base font-semibold"
              style={{ color: styles.textPrimary }}
            >
              {title}
            </h3>
            <p className="text-xs" style={{ color: styles.textMuted }}>
              {description}
            </p>
          </div>
        </div>
        <PriceTypeBadge type={priceType} size="md" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Stats row */}
        <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Package size={16} style={{ color: styles.textMuted }} />
            <span className="text-sm" style={{ color: styles.textSecondary }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className={isRtl ? 'text-left' : 'text-right'}>
            <div className="text-xs" style={{ color: styles.textMuted }}>
              {priceType === 'confirmed' ? 'Total' : 'Est. Total'}
            </div>
            <div className="text-xl font-bold" style={{ color }}>
              {currency} {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-4">
          <FlowInfoBanner type={flowType} />
        </div>

        {/* Action button */}
        <button
          onClick={onAction}
          disabled={disabled || isProcessing || itemCount === 0}
          className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
          style={{
            backgroundColor: hasItems ? color : styles.bgSecondary,
            color: hasItems ? '#fff' : styles.textMuted,
          }}
        >
          {isProcessing ? (
            <SpinnerGap size={18} className="animate-spin" />
          ) : (
            <Icon size={18} weight="bold" />
          )}
          <span>{buttonLabel}</span>
          {hasItems && <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />}
        </button>
      </div>
    </div>
  );
};

export const Cart: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { styles, t, direction } = usePortal();
  const {
    cart,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    createRFQForSeller,
    createRFQForAll,
    setItemPurchaseMethod,
    buyNowForSeller,
    buyNowAll,
    pendingOperations,
  } = useCart();
  const isRtl = direction === 'rtl';

  // Processing state
  const [processingRFQSellerIds, setProcessingRFQSellerIds] = useState<Set<string>>(new Set());
  const [processingBuyNowSellerIds, setProcessingBuyNowSellerIds] = useState<Set<string>>(new Set());
  const [isProcessingAllRFQ, setIsProcessingAllRFQ] = useState(false);
  const [isProcessingAllBuyNow, setIsProcessingAllBuyNow] = useState(false);

  // Buy Now confirmation modal state
  const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);
  const [buyNowConfirmData, setBuyNowConfirmData] = useState<{
    items: CartItem[];
    totalAmount: number;
    itemCount: number;
    sellerCount: number;
    sellerId?: string;
    sellerName?: string;
  } | null>(null);

  // Local state for purchase method selections
  const [localMethodSelections, setLocalMethodSelections] = useState<Map<string, PurchaseMethod>>(new Map());

  // Get eligibility for an item
  const getEligibilityForItem = useCallback((itemId: string): CartItemEligibility | undefined => {
    const item = cart?.items.find(i => i.itemId === itemId);
    if (!item) return undefined;
    return getItemEligibility(item);
  }, [cart]);

  // Get effective purchase method
  const getEffectiveMethod = useCallback((item: CartItem): PurchaseMethod => {
    if (localMethodSelections.has(item.itemId)) {
      return localMethodSelections.get(item.itemId)!;
    }
    if (item.selectedMethod) {
      return item.selectedMethod;
    }
    const eligibility = getItemEligibility(item);
    return eligibility.recommendedMethod;
  }, [localMethodSelections]);

  // Handle purchase method change
  const handleItemPurchaseMethodChange = useCallback((itemId: string, method: PurchaseMethod) => {
    setLocalMethodSelections(prev => {
      const next = new Map(prev);
      next.set(itemId, method);
      return next;
    });
    if (setItemPurchaseMethod) {
      setItemPurchaseMethod(itemId, method);
    }
  }, [setItemPurchaseMethod]);

  // Group items by seller
  const sellerGroups = useMemo((): CartSellerGroupType[] => {
    if (!cart || cart.items.length === 0) return [];

    const groups: Map<string, CartSellerGroupType> = new Map();

    for (const item of cart.items) {
      const sellerId = item.sellerId;
      const sellerName = item.seller?.companyName || item.seller?.name || 'Unknown Seller';

      if (!groups.has(sellerId)) {
        groups.set(sellerId, {
          sellerId,
          sellerName,
          items: [],
          subtotal: 0,
          itemCount: 0,
          buyNowItems: [],
          rfqItems: [],
          buyNowSubtotal: 0,
          rfqSubtotal: 0,
          hasBuyNowEligible: false,
          allBuyNowEligible: true,
        });
      }

      const group = groups.get(sellerId)!;
      const price = item.item?.price ?? item.priceAtAdd ?? 0;
      const itemSubtotal = price * item.quantity;
      const eligibility = getItemEligibility(item);
      const effectiveMethod = getEffectiveMethod(item);

      const itemWithMethod = { ...item, selectedMethod: effectiveMethod };
      group.items.push(itemWithMethod);
      group.itemCount += item.quantity;
      group.subtotal += itemSubtotal;

      if (eligibility.buyNow.eligible) {
        group.hasBuyNowEligible = true;
      } else {
        group.allBuyNowEligible = false;
      }

      if (effectiveMethod === 'buy_now' && eligibility.buyNow.eligible) {
        group.buyNowItems.push(itemWithMethod);
        group.buyNowSubtotal += itemSubtotal;
      } else {
        group.rfqItems.push(itemWithMethod);
        group.rfqSubtotal += itemSubtotal;
      }
    }

    return Array.from(groups.values());
  }, [cart, getEffectiveMethod]);

  // Calculate totals
  const { buyNowTotal, rfqTotal, buyNowItemCount, rfqItemCount } = useMemo(() => {
    let buyNowTotal = 0;
    let rfqTotal = 0;
    let buyNowItemCount = 0;
    let rfqItemCount = 0;

    for (const group of sellerGroups) {
      buyNowTotal += group.buyNowSubtotal;
      rfqTotal += group.rfqSubtotal;
      buyNowItemCount += group.buyNowItems.reduce((sum, item) => sum + item.quantity, 0);
      rfqItemCount += group.rfqItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    return { buyNowTotal, rfqTotal, buyNowItemCount, rfqItemCount };
  }, [sellerGroups]);

  // Get updating item IDs
  const updatingItems = useMemo(() => {
    const items = new Set<string>();
    pendingOperations.forEach((op) => {
      if (op.startsWith('update-') || op.startsWith('remove-')) {
        items.add(op.replace('update-', '').replace('remove-', ''));
      }
    });
    return items;
  }, [pendingOperations]);

  // Handlers
  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch {
      // Error handled by context
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      setLocalMethodSelections(prev => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    } catch {
      // Error handled by context
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      setLocalMethodSelections(new Map());
    } catch {
      // Error handled by context
    }
  };

  const handleRequestRFQForSeller = async (sellerId: string) => {
    setProcessingRFQSellerIds((prev) => new Set(prev).add(sellerId));
    try {
      await createRFQForSeller(sellerId);
    } catch {
      // Error handled by context
    } finally {
      setProcessingRFQSellerIds((prev) => {
        const next = new Set(prev);
        next.delete(sellerId);
        return next;
      });
    }
  };

  const handleBuyNowForSeller = (sellerId: string) => {
    if (!buyNowForSeller) return;

    // Find the seller group to get items and totals
    const group = sellerGroups.find((g) => g.sellerId === sellerId);
    if (!group) return;

    // Get only Buy Now eligible items from this seller
    const buyNowItems = group.items.filter((item) => {
      const eligibility = getItemEligibility(item);
      return eligibility.buyNow.eligible && (item.selectedMethod === 'buy_now' || eligibility.recommendedMethod === 'buy_now');
    });

    if (buyNowItems.length === 0) return;

    // Calculate totals for Buy Now items
    let totalAmount = 0;
    for (const item of buyNowItems) {
      const price = item.item?.price ?? item.priceAtAdd ?? 0;
      totalAmount += price * item.quantity;
    }

    // Show confirmation modal
    setBuyNowConfirmData({
      items: buyNowItems,
      totalAmount,
      itemCount: buyNowItems.reduce((sum, item) => sum + item.quantity, 0),
      sellerCount: 1,
      sellerId,
      sellerName: group.sellerName,
    });
    setShowBuyNowConfirm(true);
  };

  const confirmBuyNowForSeller = async () => {
    if (!buyNowForSeller || !buyNowConfirmData?.sellerId) return;

    const sellerId = buyNowConfirmData.sellerId;
    setProcessingBuyNowSellerIds((prev) => new Set(prev).add(sellerId));
    try {
      await buyNowForSeller(sellerId);
      setShowBuyNowConfirm(false);
      setBuyNowConfirmData(null);
    } catch {
      // Error handled by context
    } finally {
      setProcessingBuyNowSellerIds((prev) => {
        const next = new Set(prev);
        next.delete(sellerId);
        return next;
      });
    }
  };

  const handleRequestRFQForAll = async () => {
    setIsProcessingAllRFQ(true);
    try {
      await createRFQForAll();
    } catch {
      // Error handled by context
    } finally {
      setIsProcessingAllRFQ(false);
    }
  };

  const handleBuyNowAll = () => {
    if (!buyNowAll) return;

    // Collect all Buy Now eligible items across all sellers
    const allBuyNowItems: CartItem[] = [];
    const sellerIds = new Set<string>();

    for (const group of sellerGroups) {
      const buyNowItems = group.items.filter((item) => {
        const eligibility = getItemEligibility(item);
        return eligibility.buyNow.eligible && (item.selectedMethod === 'buy_now' || eligibility.recommendedMethod === 'buy_now');
      });

      for (const item of buyNowItems) {
        allBuyNowItems.push(item);
        sellerIds.add(item.sellerId);
      }
    }

    if (allBuyNowItems.length === 0) return;

    // Show confirmation modal
    setBuyNowConfirmData({
      items: allBuyNowItems,
      totalAmount: buyNowTotal,
      itemCount: buyNowItemCount,
      sellerCount: sellerIds.size,
    });
    setShowBuyNowConfirm(true);
  };

  const confirmBuyNowAll = async () => {
    if (!buyNowAll) return;

    setIsProcessingAllBuyNow(true);
    try {
      await buyNowAll();
      setShowBuyNowConfirm(false);
      setBuyNowConfirmData(null);
    } catch {
      // Error handled by context
    } finally {
      setIsProcessingAllBuyNow(false);
    }
  };

  const handleNavigateToMarketplace = () => {
    if (onNavigate) {
      onNavigate('marketplace');
    }
  };

  // Loading state
  if (isLoading && !cart) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <SpinnerGap size={40} className="animate-spin" style={{ color: styles.info }} />
      </div>
    );
  }

  // Error state
  if (error && !cart) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <p className="text-center mb-4" style={{ color: styles.error }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: styles.info, color: '#fff' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ minHeight: '100%' }}>
        <Container variant="full">
          <PageHeader
            title={t('cart.title') || 'Shopping Cart'}
            subtitle={t('cart.emptySubtitle') || 'Your cart is empty'}
            actions={
              <Button onClick={handleNavigateToMarketplace} variant="primary">
                <ShoppingCart size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
                {t('cart.browseMarketplace') || 'Browse Marketplace'}
              </Button>
            }
          />
          <div className="py-8">
            <CartEmptyState onBrowse={handleNavigateToMarketplace} />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%' }}>
      <Container variant="full">
        {/* Page Header */}
        <PageHeader
          title={t('cart.title') || 'Shopping Cart'}
          subtitle={`${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'} from ${cart.sellerCount} ${cart.sellerCount === 1 ? 'seller' : 'sellers'}`}
          actions={
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Button onClick={handleClearCart} variant="ghost" size="sm">
                <Trash size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
                {t('cart.clear') || 'Clear Cart'}
              </Button>
              <Button onClick={handleNavigateToMarketplace} variant="secondary" size="sm">
                <ArrowLeft size={16} className={`${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} />
                {t('cart.continueBrowsing') || 'Continue Shopping'}
              </Button>
            </div>
          }
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            icon={Package}
            label={t('cart.totalItems') || 'Total Items'}
            value={cart.itemCount}
            color={styles.info}
          />
          <SummaryCard
            icon={Storefront}
            label={t('cart.sellers') || 'Sellers'}
            value={cart.sellerCount}
            color={styles.info}
          />
          <SummaryCard
            icon={Lightning}
            label={t('cart.buyNowItems') || 'Buy Now'}
            value={buyNowItemCount}
            color={styles.success}
            subtitle={buyNowItemCount > 0 ? `${cart.currency} ${buyNowTotal.toLocaleString()}` : undefined}
            priceType={buyNowItemCount > 0 ? 'confirmed' : undefined}
            highlight={buyNowItemCount > 0}
          />
          <SummaryCard
            icon={PaperPlaneTilt}
            label={t('cart.rfqItems') || 'Request Quote'}
            value={rfqItemCount}
            color="#f59e0b"
            subtitle={rfqItemCount > 0 ? `${cart.currency} ${rfqTotal.toLocaleString()}` : undefined}
            priceType={rfqItemCount > 0 ? 'estimated' : undefined}
            highlight={rfqItemCount > 0}
          />
        </div>

        {/* Action Panels - Purchase Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Buy Now Panel - Confirmed Prices */}
          <ActionPanel
            title={t('cart.buyNow.title') || 'Buy Now'}
            description={t('cart.buyNow.description') || 'Ready for immediate checkout'}
            icon={Lightning}
            color={styles.success}
            buttonLabel={t('cart.buyNow.button') || 'Checkout Now'}
            itemCount={buyNowItemCount}
            total={buyNowTotal}
            currency={cart.currency}
            onAction={handleBuyNowAll}
            isProcessing={isProcessingAllBuyNow}
            disabled={buyNowItemCount === 0}
            priceType="confirmed"
            flowType="buy_now"
          />

          {/* Request Quote Panel - Estimated Prices */}
          <ActionPanel
            title={t('cart.rfq.title') || 'Request Quote'}
            description={t('cart.rfq.description') || 'Get negotiated pricing'}
            icon={PaperPlaneTilt}
            color="#f59e0b"
            buttonLabel={t('cart.rfq.button') || 'Request All Quotes'}
            itemCount={rfqItemCount}
            total={rfqTotal}
            currency={cart.currency}
            onAction={handleRequestRFQForAll}
            isProcessing={isProcessingAllRFQ}
            disabled={rfqItemCount === 0}
            priceType="estimated"
            flowType="rfq"
          />
        </div>

        {/* Seller Groups */}
        <div className="mb-6">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: styles.textPrimary }}
          >
            {t('cart.itemsBySeller') || 'Items by Seller'}
          </h2>
          <div className="space-y-4">
            {sellerGroups.map((group) => (
              <CartSellerGroup
                key={group.sellerId}
                group={group}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onRequestRFQ={() => handleRequestRFQForSeller(group.sellerId)}
                onBuyNow={group.hasBuyNowEligible ? () => handleBuyNowForSeller(group.sellerId) : undefined}
                onItemPurchaseMethodChange={handleItemPurchaseMethodChange}
                getItemEligibility={getEligibilityForItem}
                isProcessingRFQ={processingRFQSellerIds.has(group.sellerId)}
                isProcessingBuyNow={processingBuyNowSellerIds.has(group.sellerId)}
                updatingItems={updatingItems}
              />
            ))}
          </div>
        </div>

        {/* Bottom Total Bar - Enhanced with price breakdown */}
        <div
          className="sticky bottom-0 -mx-6 px-6 py-4 border-t shadow-lg"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
          }}
        >
          <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Total Section with breakdown */}
            <div className={isRtl ? 'text-right' : ''}>
              <div className="text-sm" style={{ color: styles.textMuted }}>
                {t('cart.estimatedTotal') || 'Cart Total'}
              </div>
              <div className="text-2xl font-bold" style={{ color: styles.textPrimary }}>
                {cart.currency} {cart.estimatedTotal.toLocaleString()}
              </div>
              {/* Price type breakdown */}
              {(buyNowItemCount > 0 || rfqItemCount > 0) && (
                <div className={`flex items-center gap-4 mt-1 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {buyNowItemCount > 0 && (
                    <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <CheckCircle size={12} weight="fill" style={{ color: styles.success }} />
                      <span style={{ color: styles.textMuted }}>Confirmed:</span>
                      <span style={{ color: styles.success }}>{cart.currency} {buyNowTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {rfqItemCount > 0 && (
                    <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Clock size={12} weight="fill" style={{ color: '#f59e0b' }} />
                      <span style={{ color: styles.textMuted }}>Estimated:</span>
                      <span style={{ color: '#f59e0b' }}>{cart.currency} {rfqTotal.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {rfqItemCount > 0 && (
                <Button
                  onClick={handleRequestRFQForAll}
                  variant="secondary"
                  size="lg"
                  disabled={isProcessingAllRFQ}
                >
                  {isProcessingAllRFQ ? (
                    <SpinnerGap size={18} className="animate-spin" />
                  ) : (
                    <PaperPlaneTilt size={18} className={isRtl ? 'ml-2' : 'mr-2'} />
                  )}
                  {t('cart.requestQuotes') || 'Request Quotes'} ({rfqItemCount})
                </Button>
              )}
              {buyNowItemCount > 0 && (
                <Button
                  onClick={handleBuyNowAll}
                  variant="primary"
                  size="lg"
                  disabled={isProcessingAllBuyNow}
                >
                  {isProcessingAllBuyNow ? (
                    <SpinnerGap size={18} className="animate-spin" />
                  ) : (
                    <Lightning size={18} weight="fill" className={isRtl ? 'ml-2' : 'mr-2'} />
                  )}
                  {t('cart.checkout') || 'Checkout'} ({buyNowItemCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* Buy Now Confirmation Modal */}
      {buyNowConfirmData && (
        <BuyNowConfirmModal
          isOpen={showBuyNowConfirm}
          onClose={() => {
            setShowBuyNowConfirm(false);
            setBuyNowConfirmData(null);
          }}
          onConfirm={buyNowConfirmData.sellerId ? confirmBuyNowForSeller : confirmBuyNowAll}
          isProcessing={buyNowConfirmData.sellerId
            ? processingBuyNowSellerIds.has(buyNowConfirmData.sellerId)
            : isProcessingAllBuyNow
          }
          items={buyNowConfirmData.items}
          totalAmount={buyNowConfirmData.totalAmount}
          itemCount={buyNowConfirmData.itemCount}
          sellerCount={buyNowConfirmData.sellerCount}
          currency={cart.currency}
          sellerName={buyNowConfirmData.sellerName}
        />
      )}
    </div>
  );
};

export default Cart;
