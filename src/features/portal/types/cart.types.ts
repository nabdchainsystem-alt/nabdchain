// =============================================================================
// Buyer Cart System - Type Definitions
// =============================================================================
// Dual purchase flow: Buy Now (direct) + Request Quote (RFQ)
// =============================================================================

// =============================================================================
// Purchase Method Types
// =============================================================================

export type PurchaseMethod = 'buy_now' | 'request_quote';

export interface BuyNowEligibility {
  eligible: boolean;
  reason?: string; // Explains why not eligible (e.g., "Out of stock", "Quote only")
}

// =============================================================================
// Cart Item Types
// =============================================================================

export interface CartItemSnapshot {
  id: string;
  name: string;
  nameAr: string | null;
  sku: string;
  price: number;
  currency: string;
  stock: number;
  minOrderQty: number;
  maxOrderQty: number | null;
  images: string | null;
  status: string;
  // Buy Now eligibility fields
  allowDirectPurchase?: boolean; // Seller allows direct purchase
  isFixedPrice?: boolean; // Price is fixed (not negotiable)
}

export interface CartItemSeller {
  id: string;
  companyName: string | null;
  name: string | null;
}

export interface CartItem {
  id: string;
  itemId: string;
  sellerId: string;
  quantity: number;
  priceAtAdd: number | null;
  itemName: string | null;
  itemSku: string | null;
  addedAt: string;
  updatedAt: string;
  // Enriched from API
  item?: CartItemSnapshot;
  seller?: CartItemSeller;
  // Purchase method (selected by buyer)
  selectedMethod?: PurchaseMethod;
}

// Computed eligibility for an item
export interface CartItemEligibility {
  buyNow: BuyNowEligibility;
  recommendedMethod: PurchaseMethod;
}

// =============================================================================
// Cart Types
// =============================================================================

export interface Cart {
  id: string;
  buyerId: string;
  isLocked: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  // Computed
  itemCount: number;
  sellerCount: number;
  estimatedTotal: number;
  currency: string;
}

export interface CartSellerGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  // Dual flow computed values
  buyNowItems: CartItem[];
  rfqItems: CartItem[];
  buyNowSubtotal: number;
  rfqSubtotal: number;
  hasBuyNowEligible: boolean;
  allBuyNowEligible: boolean;
}

// =============================================================================
// API Input/Output Types
// =============================================================================

export interface AddToCartInput {
  itemId: string;
  quantity?: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CreateRFQResult {
  success: boolean;
  message: string;
  rfqIds: string[];
  itemCount: number;
  sellerCount: number;
}

export interface BuyNowResult {
  success: boolean;
  message: string;
  orderIds: string[];
  itemCount: number;
  sellerCount: number;
  totalAmount: number;
  currency: string;
}

export interface BuyNowInput {
  itemIds?: string[]; // Specific items, or all Buy Now eligible if empty
  sellerId?: string; // Buy from specific seller only
}

// =============================================================================
// Cart Context Types
// =============================================================================

export interface CartContextState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  // Optimistic state
  pendingOperations: Set<string>;
}

export interface CartContextActions {
  refreshCart: () => Promise<void>;
  addToCart: (itemId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  createRFQForSeller: (sellerId: string) => Promise<CreateRFQResult>;
  createRFQForAll: () => Promise<CreateRFQResult>;
  isItemInCart: (itemId: string) => boolean;
  getItemQuantity: (itemId: string) => number;
  // Dual purchase flow
  setItemPurchaseMethod: (itemId: string, method: PurchaseMethod) => void;
  buyNowForSeller: (sellerId: string) => Promise<BuyNowResult>;
  buyNowAll: () => Promise<BuyNowResult>;
  getItemEligibility: (item: CartItem) => CartItemEligibility;
}

export type CartContextValue = CartContextState & CartContextActions;

// =============================================================================
// UI Component Props
// =============================================================================

export interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onPurchaseMethodChange?: (method: PurchaseMethod) => void;
  eligibility?: CartItemEligibility;
  isUpdating?: boolean;
  showPurchaseMethod?: boolean;
}

export interface CartSellerGroupProps {
  group: CartSellerGroup;
  onRequestRFQ: () => void;
  onBuyNow?: () => void;
  onItemPurchaseMethodChange?: (itemId: string, method: PurchaseMethod) => void;
  isProcessingRFQ?: boolean;
  isProcessingBuyNow?: boolean;
  updatingItems?: Set<string>;
}

export interface CartSummaryProps {
  cart: Cart;
  buyNowTotal: number;
  rfqTotal: number;
  buyNowItemCount: number;
  rfqItemCount: number;
  onRequestAll: () => void;
  onBuyNowAll: () => void;
  onClearCart: () => void;
  onContinueBrowsing: () => void;
  isProcessingRFQ?: boolean;
  isProcessingBuyNow?: boolean;
}

export interface AddToCartButtonProps {
  itemId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showQuantity?: boolean;
}
